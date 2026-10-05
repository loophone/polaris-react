import {createContext} from 'react';
import type {Dispatch, SetStateAction} from 'react';

interface NavigationContextType {
  location: string;
  onNavigationDismiss?(): void;
  withinContentContainer?: boolean;
  collapsed?: boolean;
  toggleCollapsed?(): void;
  activeCollapsedSubNavigationId?: string | null;
  setActiveCollapsedSubNavigationId?: Dispatch<SetStateAction<string | null>>;
}

export const NavigationContext = createContext<NavigationContextType>({
  location: '',
});
