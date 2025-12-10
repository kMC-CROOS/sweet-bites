import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useWelcomeScreen = () => {
    const [showWelcome, setShowWelcome] = useState(false);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        // Show welcome screen on every login
        console.log('Welcome Screen Hook - isAuthenticated:', isAuthenticated, 'user:', user);
        if (isAuthenticated && user) {
            console.log('Welcome Screen Hook - Setting timer to show welcome screen');
            // Add a small delay to ensure the app is fully loaded
            const timer = setTimeout(() => {
                console.log('Welcome Screen Hook - Timer fired, setting showWelcome to true');
                setShowWelcome(true);
                setHasShownWelcome(true);
            }, 500);

            return () => clearTimeout(timer);
        } else {
            console.log('Welcome Screen Hook - Setting showWelcome to false');
            setShowWelcome(false);
        }
    }, [isAuthenticated, user]);

    const closeWelcome = () => {
        setShowWelcome(false);
    };

    const showWelcomeAgain = () => {
        setShowWelcome(true);
    };

    return {
        showWelcome,
        hasShownWelcome,
        closeWelcome,
        showWelcomeAgain
    };
};

export default useWelcomeScreen;
