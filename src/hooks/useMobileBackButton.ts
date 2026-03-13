
import { useEffect, useRef } from 'react';

/**
 * Hook para interceptar o botão "Voltar" do celular (Android/iOS).
 * Em vez de voltar para a página anterior, ele fecha o modal/formulário ativo.
 */
export function useMobileBackButton(isOpen: boolean, onClose: () => void) {
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        // Se não estiver aberto, não faz nada
        if (!isOpen) return;

        // ID único para identificar este modal no histórico
        const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;

        // Insere um "estado falso" no histórico do navegador
        window.history.pushState({ modalId }, '');

        const handlePopState = (event: PopStateEvent) => {
            // Quando o botão voltar do celular é pressionado, este evento é disparado
            // e o "estado falso" é consumido pelo navegador.
            // Então apenas fechamos o modal.
            onCloseRef.current();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);

            // Se o modal for fechado por outra via (ex: botão Salvar ou X),
            // o estado falso ainda está no histórico. Precisamos removê-lo.
            // Checamos se o estado atual é o nosso antes de dar "back".
            if (window.history.state?.modalId === modalId) {
                window.history.back();
            }
        };
    }, [isOpen]);
}
