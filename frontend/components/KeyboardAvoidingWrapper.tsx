import { KeyboardAvoidingView, ScrollView } from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  scroll?: boolean;
}

export default function KeyboardAvoidingWrapper({ children, scroll = true }: Props) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      // Edge-to-edge Android no longer resizes the window for the keyboard, so pad on both platforms
      behavior="padding"
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}
