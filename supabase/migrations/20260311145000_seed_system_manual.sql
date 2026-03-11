-- Generate a UUID for the manual
DO $$
DECLARE
    manual_id UUID := uuid_generate_v4();
BEGIN
    INSERT INTO public.manuals (id, title, description, category)
    VALUES (
        manual_id,
        'Manual de Operação do Sistema',
        'Guia completo passo a passo sobre como utilizar os módulos de Ordem de Serviço, Kanban, Financeiro e Cadastros no sistema.',
        'Sistema'
    );

    -- Passo 1: Dashboard e Visão Geral
    INSERT INTO public.manual_steps (manual_id, step_order, title, description)
    VALUES (
        manual_id,
        1,
        'Dashboard e Atalhos Rápidos',
        'O Dashboard é a tela principal do sistema. Aqui você encontra:' || E'\n\n' ||
        '1. Métricas da empresa (lucro, serviços pendentes).' || E'\n' ||
        '2. Gráficos de faturamento da semana.' || E'\n' ||
        '3. Os atalhos rápidos (Nova OS, Novo Cliente, Nova Venda) que agilizam o dia a dia.' || E'\n\n' ||
        'Clique em editar este passo para adicionar o print da sua tela inicial do sistema.'
    );

    -- Passo 2: Cadastros
    INSERT INTO public.manual_steps (manual_id, step_order, title, description)
    VALUES (
        manual_id,
        2,
        'Módulo de Cadastros (Clientes, Produtos e Serviços)',
        'Antes de emitir uma Ordem de Serviço ou Venda, é ideal ter os dados cadastrados:' || E'\n\n' ||
        '- Clientes: Nome, telefone com WhatsApp para notificações.' || E'\n' ||
        '- Produtos: Controle de estoque, valor de custo e valor de venda.' || E'\n' ||
        '- Serviços: Nome padrão e valor do seu serviço para facilitar a busca.' || E'\n\n' ||
        'Em qualquer tela de cadastro, basta clicar no botão azul "+ Novo" no canto superior direito.'
    );

    -- Passo 3: Ordem de Serviço (Assistente)
    INSERT INTO public.manual_steps (manual_id, step_order, title, description)
    VALUES (
        manual_id,
        3,
        'Criando uma Ordem de Serviço (Wizard)',
        'Emitir uma nova OS ficou muito simples com o nosso assistente passo a passo:' || E'\n\n' ||
        'Passo 1. Selecione o Cliente na base.' || E'\n' ||
        'Passo 2. Selecione qual o Equipamento ou crie um novo na hora. Preencha acessórios e senha (com padrão de desenho desbloqueio opcional).' || E'\n' ||
        'Passo 3. Descreva o Defeito / Relato.' || E'\n' ||
        'Passo 4. Adicione os Serviços e Peças orçadas, se já souber.' || E'\n' ||
        'Passo 5. Resumo da OS: aqui você confere os valores, assina e envia o comprovante padrão direto pelo WhatsApp do cliente usando a integração!'
    );

    -- Passo 4: Kanban
    INSERT INTO public.manual_steps (manual_id, step_order, title, description)
    VALUES (
        manual_id,
        4,
        'Quadro Kanban (Fluxo de Trabalho)',
        'O Kanban permite ver em qual etapa está cada serviço da assistência técnica:' || E'\n\n' ||
        '- Arraste os cartões de OS de uma coluna para outra (ex: Em Orçamento -> Aprovado -> Em Andamento -> Concluído).' || E'\n' ||
        '- Indicadores de Tempo: Em cada placa, você verá uma bolinha de cor baseada no tempo de espera (Verde = em dia, Amarelo = precisando de atenção, Vermelho = atrasado/urgente).' || E'\n' ||
        '- Clique em qualquer placa para detalhar a ordem de serviço ou enviar uma mensagem rápida.'
    );

    -- Passo 5: Painel Financeiro
    INSERT INTO public.manual_steps (manual_id, step_order, title, description)
    VALUES (
        manual_id,
        5,
        'Módulo Financeiro e Vendas/Compras',
        'Controle o fluxo de caixa do seu negócio de forma centralizada:' || E'\n\n' ||
        '- Vendas e Compras (PDV): Você pode lançar vendas diretas (ex: Cabo de celular) sem precisar abrir uma OS.' || E'\n' ||
        '- Contas a Pagar/Receber: As vendas e OS liquidadas caem automaticamente aqui.' || E'\n' ||
        '- Relatórios e DRE: O sistema calcula seus lucros no mês, despesas e separa tudo por categorias bonitas. É possível até gerar PDF para sua contabilidade.'
    );
END $$;
