import { useEffect, useState, useMemo } from 'react';
import { formatOSNumber } from '@/lib/osUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ServiceOrder, ServiceOrderItem, PRIORITY_CONFIG } from '@/types/serviceOrder';
import { useStatusSettings } from '@/hooks/useStatusSettings';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useEquipment } from '@/hooks/useEquipment';
import { formatEquipmentCode } from '@/types/equipment';
import { Loader2, Plus, Trash2, Package, Wrench, ChevronsUpDown, Check, UserPlus, Monitor } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ClientForm } from '@/components/clients/ClientForm';
import { ServiceForm } from '@/components/services/ServiceForm';
import { ProductForm } from '@/components/products/ProductForm';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';


const osSchema = z.object({
  client_id: z.string().optional().nullable(),
  equipment_id: z.string().optional().nullable(),
  status: z.string().min(1, 'Selecione um status'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  serial_number: z.string().max(50).optional().or(z.literal('')),
  accessories: z.string().max(200).optional().or(z.literal('')),
  device_password: z.string().max(200).optional().or(z.literal('')),
  reported_issue: z.string().min(5, 'Descreva o problema relatado').max(1000),
  diagnosis: z.string().max(1000).optional().or(z.literal('')),
  solution: z.string().max(1000).optional().or(z.literal('')),
  internal_notes: z.string().max(500).optional().or(z.literal('')),
  estimated_completion: z.string().optional().or(z.literal('')),
  created_at: z.string().optional().or(z.literal('')),
  discount: z.coerce.number().min(0).default(0),
  payment_method: z.string().optional().nullable(),
});

type OSFormData = z.infer<typeof osSchema>;

interface ItemFormData {
  type: 'product' | 'service';
  description: string;
  quantity: number;
  unit_price: number;
  product_id?: string;
}

interface OSFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: ServiceOrder | null;
  onSubmit: (data: OSFormData & { items: ItemFormData[]; total_services: number; total_products: number; total: number }) => void;
  isSubmitting?: boolean;
  existingItems?: ServiceOrderItem[];
}

export function OSForm({
  open,
  onOpenChange,
  order,
  onSubmit,
  isSubmitting,
  existingItems = [],
}: OSFormProps) {
  const { statusConfig, orderedStatuses } = useStatusSettings();
  const { clients, createClient } = useClients();
  const { products, createProduct } = useProducts();
  const { services, createService } = useServices();
  const { equipment: equipmentList, createEquipment } = useEquipment();
  const activeProducts = products.filter(p => p.active);
  const activeServices = services.filter(s => s.active);
  const activeEquipment = equipmentList.filter(e => e.active);
  
  const [items, setItems] = useState<ItemFormData[]>([]);
  const [newItem, setNewItem] = useState<ItemFormData>({
    type: 'service',
    description: '',
    quantity: 1,
    unit_price: 0,
    product_id: undefined,
  });
  
  // Quantity states for catalog items
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
  // Combobox states
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [productOpen, setProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  
  // Dialog states
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);

  const form = useForm<OSFormData>({
    resolver: zodResolver(osSchema),
    defaultValues: {
      client_id: null,
      equipment_id: null,
      status: 'pending',
      priority: 'normal',
      serial_number: '',
      accessories: '',
      device_password: '',
      reported_issue: '',
      diagnosis: '',
      solution: '',
      internal_notes: '',
      estimated_completion: '',
      created_at: new Date().toISOString().split('T')[0],
      discount: 0,
      payment_method: null,
    },
  });

  // Filtered lists
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone?.includes(clientSearch) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return activeServices;
    return activeServices.filter(s => 
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.code?.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [activeServices, serviceSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return activeProducts;
    return activeProducts.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [activeProducts, productSearch]);

  const filteredEquipment = useMemo(() => {
    if (!equipmentSearch) return activeEquipment;
    return activeEquipment.filter(e => 
      e.description.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      (e.code && `EQP-${e.code}`.toLowerCase().includes(equipmentSearch.toLowerCase()))
    );
  }, [activeEquipment, equipmentSearch]);

  useEffect(() => {
    if (open) {
      form.reset({
        client_id: order?.client_id ?? null,
        equipment_id: order?.equipment_id ?? null,
        status: order?.status ?? 'pending',
        priority: order?.priority ?? 'normal',
        serial_number: order?.serial_number ?? '',
        accessories: order?.accessories ?? '',
        device_password: (order as any)?.device_password ?? '',
        reported_issue: order?.reported_issue ?? '',
        diagnosis: order?.diagnosis ?? '',
        solution: order?.solution ?? '',
        internal_notes: order?.internal_notes ?? '',
        estimated_completion: order?.estimated_completion ?? '',
        created_at: order?.created_at ? order.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        discount: order?.discount ?? 0,
        payment_method: order?.payment_method ?? null,
      });
      setItems(existingItems.map(item => ({
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })));
      setClientSearch('');
      setServiceSearch('');
      setProductSearch('');
      setEquipmentSearch('');
    }
  }, [open, order, existingItems, form]);

  const addItem = () => {
    if (newItem.description.trim() && newItem.quantity > 0) {
      setItems([...items, { ...newItem }]);
      setNewItem({ type: 'service', description: '', quantity: 1, unit_price: 0, product_id: undefined });
    }
  };

  const selectProductFromCatalog = (productId: string) => {
    setSelectedProduct(productId);
    setProductOpen(false);
    setProductSearch('');
  };

  const selectServiceFromCatalog = (serviceId: string) => {
    setSelectedService(serviceId);
    setServiceOpen(false);
    setServiceSearch('');
  };

  const addSelectedProduct = () => {
    if (selectedProduct && productQuantity > 0) {
      const product = activeProducts.find(p => p.id === selectedProduct);
      if (product) {
        setItems([...items, {
          type: 'product',
          description: product.name,
          quantity: productQuantity,
          unit_price: product.sale_price,
          product_id: product.id,
        }]);
        setSelectedProduct(null);
        setProductQuantity(1);
      }
    }
  };

  const addSelectedService = () => {
    if (selectedService && serviceQuantity > 0) {
      const service = activeServices.find(s => s.id === selectedService);
      if (service) {
        setItems([...items, {
          type: 'service',
          description: service.name,
          quantity: serviceQuantity,
          unit_price: service.sale_price,
        }]);
        setSelectedService(null);
        setServiceQuantity(1);
      }
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalServices = items
      .filter(i => i.type === 'service')
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const totalProducts = items
      .filter(i => i.type === 'product')
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const discount = form.watch('discount') || 0;
    const total = totalServices + totalProducts - discount;
    return { totalServices, totalProducts, total: Math.max(0, total) };
  };

  const { totalServices, totalProducts, total } = calculateTotals();

  const handleSubmit = (data: OSFormData) => {
    // Convert empty strings to null for date fields to avoid DB errors
    const cleanedData = {
      ...data,
      estimated_completion: data.estimated_completion?.trim() || null,
      created_at: data.created_at?.trim() ? new Date(data.created_at + 'T12:00:00').toISOString() : undefined,
      equipment_id: data.equipment_id || null,
      serial_number: data.serial_number?.trim() || null,
      accessories: data.accessories?.trim() || null,
      device_password: data.device_password?.trim() || null,
      diagnosis: data.diagnosis?.trim() || null,
      solution: data.solution?.trim() || null,
      internal_notes: data.internal_notes?.trim() || null,
    };
    
    onSubmit({
      ...cleanedData,
      items,
      total_services: totalServices,
      total_products: totalProducts,
      total,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const selectedClient = clients.find(c => c.id === form.watch('client_id'));

  // Handle inline creates
  const handleCreateClient = (data: any) => {
    createClient.mutate(data, {
      onSuccess: (newClient) => {
        form.setValue('client_id', newClient.id);
        setClientFormOpen(false);
      },
    });
  };

  const handleCreateService = (data: any) => {
    createService.mutate(data, {
      onSuccess: (newService) => {
        setItems([...items, {
          type: 'service',
          description: newService.name,
          quantity: 1,
          unit_price: newService.sale_price,
        }]);
        setServiceFormOpen(false);
      },
    });
  };

  const handleCreateProduct = (data: any) => {
    createProduct.mutate(data, {
      onSuccess: (newProduct) => {
        setItems([...items, {
          type: 'product',
          description: newProduct.name,
          quantity: 1,
          unit_price: newProduct.sale_price,
          product_id: newProduct.id,
        }]);
        setProductFormOpen(false);
      },
    });
  };

  const handleCreateEquipment = async (data: { description: string; active: boolean }) => {
    createEquipment.mutate(data, {
      onSuccess: (newEquipment) => {
        form.setValue('equipment_id', newEquipment.id);
        setEquipmentFormOpen(false);
      },
    });
  };

  const formContent = (
    <ScrollArea className="w-full max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)] overflow-x-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-3 sm:p-6 space-y-4 sm:space-y-5 w-full max-w-full mx-auto min-w-0 overflow-x-hidden">
                
                {/* === SEÇÃO: CLIENTE === */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Cliente
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Selecionar Cliente</FormLabel>
                        <div className="flex gap-2 min-w-0">
                          <Popover open={clientOpen} onOpenChange={setClientOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={clientOpen}
                                  className="flex-1 min-w-0 justify-between font-normal"
                                >
                                  <span className="truncate">{selectedClient ? selectedClient.name : "Buscar cliente..."}</span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[min(400px,calc(100vw-32px))] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput 
                                  placeholder="Buscar por nome, telefone ou email..." 
                                  value={clientSearch}
                                  onValueChange={setClientSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {filteredClients.map((client) => (
                                      <CommandItem
                                        key={client.id}
                                        value={client.id}
                                        onSelect={() => {
                                          field.onChange(client.id);
                                          setClientOpen(false);
                                          setClientSearch('');
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === client.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{client.name}</span>
                                          {client.phone && (
                                            <span className="text-xs text-muted-foreground">{client.phone}</span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setClientFormOpen(true)}
                            title="Cadastrar novo cliente"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {field.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => field.onChange(null)}
                              title="Remover cliente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* === SEÇÃO: STATUS E PRIORIDADE === */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border border-border">
                            {orderedStatuses.map((key) => (
                              <SelectItem key={key} value={key}>
                                {statusConfig[key].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border border-border">
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* === DATA DE ENTRADA === */}
                <FormField
                  control={form.control}
                  name="created_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Entrada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* === SEÇÃO: EQUIPAMENTO === */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Equipamento
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="equipment_id"
                    render={({ field }) => {
                      const selectedEquipment = equipmentList.find(e => e.id === field.value);
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Selecionar Equipamento</FormLabel>
                          <div className="flex gap-2 min-w-0">
                            <Popover open={equipmentOpen} onOpenChange={setEquipmentOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={equipmentOpen}
                                    className="flex-1 min-w-0 justify-between font-normal"
                                  >
                                    <span className="truncate">
                                      {selectedEquipment 
                                        ? `${formatEquipmentCode(selectedEquipment.code)} - ${selectedEquipment.description}`
                                        : "Buscar equipamento..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[min(400px,calc(100vw-32px))] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput 
                                    placeholder="Buscar por código ou descrição..." 
                                    value={equipmentSearch}
                                    onValueChange={setEquipmentSearch}
                                  />
                                  <CommandList>
                                    <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {filteredEquipment.map((eq) => (
                                        <CommandItem
                                          key={eq.id}
                                          value={eq.id}
                                          onSelect={() => {
                                            field.onChange(eq.id);
                                            setEquipmentOpen(false);
                                            setEquipmentSearch('');
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === eq.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{formatEquipmentCode(eq.code)} - {eq.description}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setEquipmentFormOpen(true)}
                              title="Cadastrar novo equipamento"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => field.onChange(null)}
                                title="Remover equipamento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="serial_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série</FormLabel>
                          <FormControl>
                            <Input placeholder="S/N" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accessories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Acessórios</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Carregador, mouse" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="device_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Dispositivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 1234 ou padrão de desbloqueio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* === SEÇÃO: PROBLEMA === */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Problema</h3>
                  
                  <FormField
                    control={form.control}
                    name="reported_issue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problema Relatado *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o problema relatado pelo cliente..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_completion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previsão de Entrega</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* === SEÇÃO: SERVIÇOS === */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 min-w-0">
                    <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
                      <Wrench className="h-5 w-5 shrink-0" />
                      <span className="truncate">Serviços</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setServiceFormOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo Serviço
                    </Button>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4 space-y-3 bg-blue-50/50 dark:bg-blue-950/20 min-w-0 overflow-x-hidden">
                    <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                      <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="flex-1 min-w-0 justify-between font-normal"
                          >
                            <span className="truncate">
                              {selectedService 
                                ? activeServices.find(s => s.id === selectedService)?.name 
                                : "Buscar serviço cadastrado..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(500px,calc(100vw-32px))] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Buscar por nome ou código..." 
                              value={serviceSearch}
                              onValueChange={setServiceSearch}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                              <CommandGroup>
                                {filteredServices.map((service) => (
                                  <CommandItem
                                    key={service.id}
                                    value={service.id}
                                    onSelect={() => selectServiceFromCatalog(service.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedService === service.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center justify-between w-full gap-2 min-w-0">
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate">{service.name}</span>
                                        {service.code && (
                                          <span className="text-xs text-muted-foreground truncate">{service.code}</span>
                                        )}
                                      </div>
                                      <span className="text-sm font-medium shrink-0">{formatCurrency(service.sale_price)}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex w-full sm:w-auto gap-2">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 sm:w-20"
                          placeholder="Qtd"
                        />
                        <Button
                          type="button"
                          onClick={addSelectedService}
                          disabled={!selectedService}
                          className="flex-1 sm:flex-none"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    
                    {selectedService && (
                      <p className="text-sm text-muted-foreground break-words">
                        Selecionado: {activeServices.find(s => s.id === selectedService)?.name} - {formatCurrency(activeServices.find(s => s.id === selectedService)?.sale_price || 0)} x {serviceQuantity} = {formatCurrency((activeServices.find(s => s.id === selectedService)?.sale_price || 0) * serviceQuantity)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* === SEÇÃO: PRODUTOS === */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 min-w-0">
                    <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
                      <Package className="h-5 w-5 shrink-0" />
                      <span className="truncate">Produtos / Peças</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductFormOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo Produto
                    </Button>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4 space-y-3 bg-muted/30 min-w-0 overflow-x-hidden">
                    <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                      <Popover open={productOpen} onOpenChange={setProductOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="flex-1 min-w-0 justify-between font-normal"
                          >
                            <span className="truncate">
                              {selectedProduct 
                                ? activeProducts.find(p => p.id === selectedProduct)?.name 
                                : "Buscar produto cadastrado..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(500px,calc(100vw-32px))] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Buscar por nome ou SKU..." 
                              value={productSearch}
                              onValueChange={setProductSearch}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                              <CommandGroup>
                                {filteredProducts.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.id}
                                    onSelect={() => selectProductFromCatalog(product.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedProduct === product.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center justify-between w-full gap-2 min-w-0">
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate">{product.name}</span>
                                        {product.category && (
                                          <span className="text-xs text-muted-foreground truncate">{product.category}</span>
                                        )}
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-sm font-medium">{formatCurrency(product.sale_price)}</span>
                                        <span className="text-xs text-muted-foreground ml-2">Est: {product.stock_quantity}</span>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex w-full sm:w-auto gap-2">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 sm:w-20"
                          placeholder="Qtd"
                        />
                        <Button
                          type="button"
                          onClick={addSelectedProduct}
                          disabled={!selectedProduct}
                          className="flex-1 sm:flex-none"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    
                    {selectedProduct && (
                      <p className="text-sm text-muted-foreground break-words">
                        Selecionado: {activeProducts.find(p => p.id === selectedProduct)?.name} - {formatCurrency(activeProducts.find(p => p.id === selectedProduct)?.sale_price || 0)} x {productQuantity} = {formatCurrency((activeProducts.find(p => p.id === selectedProduct)?.sale_price || 0) * productQuantity)} | Estoque: {activeProducts.find(p => p.id === selectedProduct)?.stock_quantity}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* === ITEM MANUAL === */}
                <div className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <h4 className="font-medium text-sm sm:text-base">Adicionar Item Manual</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Select
                      value={newItem.type}
                      onValueChange={(value: 'product' | 'service') =>
                        setNewItem({ ...newItem, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="service">Serviço</SelectItem>
                        <SelectItem value="product">Produto</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Descrição"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      className="sm:col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      type="number"
                      placeholder="Qtd"
                      min={0.01}
                      step={0.01}
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Valor Unit."
                      min={0}
                      step={0.01}
                      value={newItem.unit_price}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <div className="flex items-center text-sm text-muted-foreground">
                      = {formatCurrency(newItem.quantity * newItem.unit_price)}
                    </div>
                    <Button type="button" onClick={addItem} size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* === ITENS ADICIONADOS === */}
                {items.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    <div className="p-3 bg-muted/50 font-medium">
                      Itens da OS ({items.length})
                    </div>
                    {items.map((item, index) => (
                      <div key={index} className="p-3 flex items-center justify-between gap-2 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              item.type === 'service' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                            )}>
                              {item.type === 'service' ? 'Serviço' : 'Produto'}
                            </span>
                            <span className="font-medium truncate">{item.description}</span>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {item.quantity} x {formatCurrency(item.unit_price)} = {formatCurrency(item.quantity * item.unit_price)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* === SEÇÃO: TOTAIS === */}
                <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                  <div className="flex justify-between text-sm">
                    <span>Serviços:</span>
                    <span>{formatCurrency(totalServices)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Produtos:</span>
                    <span>{formatCurrency(totalProducts)}</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm min-w-0">
                        <span>Desconto:</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-full sm:w-24 h-8 text-left sm:text-right"
                          {...field}
                        />
                      </div>
                    )}
                  />
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => field.onChange(value || null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit">Cartão Crédito</SelectItem>
                          <SelectItem value="debit">Cartão Débito</SelectItem>
                          <SelectItem value="promissory">Promissória</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* === AÇÕES === */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {order ? 'Salvar' : 'Criar OS'}
                  </Button>
                </div>
        </form>
      </Form>
    </ScrollArea>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-12px)] max-w-[calc(100vw-12px)] sm:max-w-[700px] max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 rounded-lg overflow-x-hidden">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b">
            <DialogTitle className="text-center text-lg">
              {order ? `Editar OS ${formatOSNumber(order.order_number, order.created_at)}` : 'Nova Ordem de Serviço'}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      <ClientForm
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSubmit={handleCreateClient}
        isSubmitting={createClient.isPending}
      />
      <ServiceForm
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        onSubmit={handleCreateService}
        isSubmitting={createService.isPending}
      />
      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSubmit={handleCreateProduct}
        isSubmitting={createProduct.isPending}
      />
      <EquipmentForm
        open={equipmentFormOpen}
        onOpenChange={setEquipmentFormOpen}
        equipment={null}
        onSubmit={handleCreateEquipment}
        isSubmitting={createEquipment.isPending}
      />
    </>
  );
}
