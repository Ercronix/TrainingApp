import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  scroll?: boolean;
}

export default function KeyboardAvoidingWrapper({ children, scroll = true }: Props) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
