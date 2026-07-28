import React, { PropsWithChildren, useContext, useState, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { flush as flushAnalytics } from "@/utils/analytics";

const AppStateStatusContext = React.createContext<{ appStateStatus: AppStateStatus | undefined } | undefined>(undefined);

export default function AppStateStatusProvider({ children }: PropsWithChildren<{}>) {
    const [appStateStatus, setAppStateStatus] = useState<AppStateStatus | undefined>(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (next) => {
            setAppStateStatus(next);
            // Ao sair da app é o melhor momento para despejar a fila de eventos:
            // não rouba rede enquanto o técnico está a trabalhar.
            if (next !== "active") void flushAnalytics();
        });
        return () => subscription.remove();
    }, []);

    return (
        <AppStateStatusContext.Provider value={{ appStateStatus }}>
            {children}
        </AppStateStatusContext.Provider>
    );
}

export function useAppStateStatus() {
    const context = useContext(AppStateStatusContext);
    if (!context) {
        throw new Error("useAppStateStatus must be used inside a AppStateStatusProvider");
    }
    return context;
}