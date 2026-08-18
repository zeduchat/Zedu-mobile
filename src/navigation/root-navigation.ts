import {
    createNavigationContainerRef,
    NavigationContainerRef,
    NavigationProp,
    ParamListBase,
} from '@react-navigation/native';
import { RootStackParamList } from './navigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type PendingNavigation = {
    name: keyof RootStackParamList;
    params?: any;
};

const pendingNavigations: PendingNavigation[] = [];

export function navigate(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
        (navigationRef as any).navigate(name, params);
        return;
    }

    pendingNavigations.push({ name, params });
}

export function flushPendingNavigations() {
    if (!navigationRef.isReady() || pendingNavigations.length === 0) {
        return;
    }

    const queue = [...pendingNavigations];
    pendingNavigations.length = 0;

    queue.forEach(({ name, params }) => {
        (navigationRef as any).navigate(name, params);
    });
}

const getFocusedRouteName = (state: any): string | undefined => {
    if (!state?.routes?.length) return undefined;

    const route = state.routes[state.index ?? 0];
    if (route?.state) {
        return getFocusedRouteName(route.state);
    }

    return route?.name;
};

export function getActiveRouteName(): string | undefined {
    if (!navigationRef.isReady()) return undefined;
    return getFocusedRouteName(navigationRef.getRootState());
}

export function dismissIncomingDirectCall(
    navigation?: NavigationProp<ParamListBase>,
) {
    const parentNavigation = navigation?.getParent?.();

    if (parentNavigation?.canGoBack?.()) {
        parentNavigation.goBack();
        return;
    }

    if (!navigationRef.isReady()) return;

    if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return;
    }

    navigate('MainTabs');
}

export function goBackFromIncomingDirectCall() {
    dismissIncomingDirectCall();
}
