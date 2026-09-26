import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { accountApi } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import { alert, confirm } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

type Pending = 'details' | 'password' | 'delete' | null;

export default function AccountModal() {
  const router = useRouter();
  const c = useTheme();
  const { user, setUser, logout } = useAuthStore();
  const [pending, setPending] = useState<Pending>(null);

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [detailsPassword, setDetailsPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deletePassword, setDeletePassword] = useState('');

  // Mirrors register.tsx; the server's validation errors carry no readable message
  const saveDetails = async () => {
    if (username.length < 3) return alert('Error', 'Username must be at least 3 characters');
    if (!/\S+@\S+\.\S+/.test(email)) return alert('Error', 'Enter a valid email');
    if (!detailsPassword) return alert('Error', 'Enter your current password to confirm');

    setPending('details');
    try {
      const updated = await accountApi.update({ username, email, currentPassword: detailsPassword });
      if (user) setUser({ ...user, username: updated.username, email: updated.email });
      setDetailsPassword('');
      alert('Saved', 'Your account details were updated.');
    } catch (error) {
      alert('Error', getErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  const changePassword = async () => {
    if (!currentPassword) return alert('Error', 'Enter your current password');
    if (newPassword.length < 6) return alert('Error', 'New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return alert('Error', 'New passwords do not match');

    setPending('password');
    try {
      const session = await accountApi.changePassword({ currentPassword, newPassword });
      if (user) setUser({ ...user, token: session.token });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed', 'You have been signed out on all other devices.');
    } catch (error) {
      alert('Error', getErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  const deleteAccount = () => {
    if (!deletePassword) return alert('Error', 'Enter your password to confirm');

    confirm(
      'Delete account',
      'This permanently deletes your account, splits, workouts and training history. This cannot be undone.',
      async () => {
        setPending('delete');
        try {
          await accountApi.deleteAccount(deletePassword);
          // AuthProvider clears the cached data and redirects to login
          logout();
        } catch (error) {
          alert('Error', getErrorMessage(error));
          setPending(null);
        }
      },
      'Delete',
    );
  };

  const busy = pending !== null;

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">ACCOUNT</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingWrapper>
        <View className="px-4 pb-16">
          <Text className="px-2 text-primary text-[40px] font-bold tracking-tighter leading-[44px] mb-8">
            MANAGE{'\n'}ACCOUNT
          </Text>

          {/* Details */}
          <View className="bg-surface rounded-md p-5 mb-3">
            <Text className="text-muted text-[10px] tracking-[3px] mb-4">DETAILS</Text>
            <Field label="USERNAME" value={username} onChangeText={setUsername} editable={!busy} />
            <Field label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" editable={!busy} />
            <Field label="CURRENT PASSWORD" value={detailsPassword} onChangeText={setDetailsPassword} secure editable={!busy} />
            <TouchableOpacity
              className={`bg-accent rounded-md py-4 items-center mt-1 ${busy ? 'opacity-50' : ''}`}
              onPress={saveDetails}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
                {pending === 'details' ? 'SAVING...' : 'SAVE DETAILS'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View className="bg-surface rounded-md p-5 mb-3">
            <Text className="text-muted text-[10px] tracking-[3px] mb-4">PASSWORD</Text>
            <Field label="CURRENT PASSWORD" value={currentPassword} onChangeText={setCurrentPassword} secure editable={!busy} />
            <Field label="NEW PASSWORD" value={newPassword} onChangeText={setNewPassword} secure editable={!busy} />
            <Field label="CONFIRM NEW PASSWORD" value={confirmPassword} onChangeText={setConfirmPassword} secure editable={!busy} />
            <TouchableOpacity
              className={`bg-accent rounded-md py-4 items-center mt-1 ${busy ? 'opacity-50' : ''}`}
              onPress={changePassword}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
                {pending === 'password' ? 'CHANGING...' : 'CHANGE PASSWORD'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delete */}
          <View className="bg-surface rounded-md p-5">
            <Text className="text-danger text-[10px] tracking-[3px] mb-2">DELETE ACCOUNT</Text>
            <Text className="text-muted text-xs mb-4">
              Permanently deletes your account and all of your data. Export your history from the profile first if you want to keep it.
            </Text>
            <Field label="PASSWORD" value={deletePassword} onChangeText={setDeletePassword} secure editable={!busy} />
            <TouchableOpacity
              className={`bg-danger-muted rounded-md py-4 flex-row items-center justify-center gap-2 mt-1 ${busy ? 'opacity-50' : ''}`}
              onPress={deleteAccount}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={16} color={c.danger} />
              <Text className="text-danger text-sm font-bold tracking-[2px]">
                {pending === 'delete' ? 'DELETING...' : 'DELETE ACCOUNT'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}

function Field({
  label,
  secure,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  keyboardType?: 'email-address';
  editable?: boolean;
}) {
  return (
    <>
      <Text className="text-muted text-[9px] tracking-[3px] mb-2">{label}</Text>
      <TextInput
        className="bg-base rounded-sm px-4 py-3 text-primary text-base mb-4"
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance="dark"
        {...props}
      />
    </>
  );
}
