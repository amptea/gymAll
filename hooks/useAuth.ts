import { router } from "expo-router";
import {
    AuthError,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { auth, db } from "../FirebaseConfig";

export const useAuth = () => {
    const [user, setUser] = useState(auth.currentUser);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setInitializing(false);

            if (user) {
                router.replace("/(tabs)/homepage");
            }
        });

        return unsubscribe;
    }, []);

    const handleSignIn = async (email: string, password: string): Promise<void> => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
        } catch (error) {
            const authError = error as AuthError;
            const errorMessage = authError.message || "Sign in failed";
            Alert.alert("Sign in failed: ", errorMessage);
        } finally {
        }
    };

    const handleSignUp = async (email: string, password: string, username: string, name: string, profilePicture?: string | null): Promise<void> => {
        if (!email || !password || !username || !name) {
            Alert.alert("Missing information", "Please fill in all the fields");
            return;
        }

        if (password.length < 8) {
            Alert.alert("Invalid Password", "Password should be at least 6 characters");
            return;
        }

        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                name: name,
                profilePicture: profilePicture || null,
            });

        } catch (error) {
            const authError = error as AuthError;
            const errorMessage = authError.message || "Sign up failed";
            Alert.alert("Sign up failed: ", errorMessage);
        } finally {
        }
    };

    const handleSignOut = async (): Promise<void> => {
        try {
            await signOut(auth);
            router.replace("/");
        } catch (error) {
            const authError = error as AuthError;
            const errorMessage = authError.message || "Sign out failed";
            Alert.alert("Sign out failed: ", errorMessage);
        } finally {
        }
    };

    return {
        user,
        initializing,
        handleSignIn,
        handleSignUp,
        handleSignOut,
    };
}; 