
import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import BootSplash from "react-native-bootsplash";
import { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from '@/navigation/navigator';
import { DataProvider } from '@/store/GlobalState';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { NotificationToastConfig } from '@/components/ui/toast';
import StatusConnection from '@/centrifugoo/status-connection';
import { flushPendingNavigations, navigationRef } from '@/navigation/root-navigation';


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  const onNavigationStateChange = (state: any) => {
    const getDeepestRoute = (navState: any): string | undefined => {
      if (!navState?.routes) return undefined;
      
      const lastRoute = navState.routes[navState.routes.length - 1];
      if (!lastRoute) return undefined;
      
      // If this route has nested state, go deeper
      if (lastRoute.state?.routes) {
        return getDeepestRoute(lastRoute.state);
      }
      
      return lastRoute.name;
    };

    const routeName = getDeepestRoute(state);
    setCurrentRoute(routeName);
    flushPendingNavigations();
  };

  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <DataProvider>
          <SafeAreaProvider>
            <NavigationContainer theme={DefaultTheme} ref={navigationRef} onStateChange={onNavigationStateChange}>
              <AppNavigator currentRoute={currentRoute} />
              <Toast config={NotificationToastConfig} />
              <StatusConnection/>
            </NavigationContainer>
          </SafeAreaProvider>
        </DataProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}


export default App;
