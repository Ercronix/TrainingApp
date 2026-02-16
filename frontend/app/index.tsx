import { Redirect } from 'expo-router';

export default function Index() {
    // TODO: Später prüfen ob User eingeloggt ist
    const isAuthenticated = true;

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}