import { supabase } from './supabaseClient.js';

/**
 * Connexion avec Email et Mot de passe
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function loginWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
}

/**
 * Inscription avec Email et Mot de passe
 * @param {string} email 
 * @param {string} password 
 * @param {object} options - { data: { full_name: string, ... } }
 * @returns {Promise<{data: any, error: any}>}
 */
export async function registerWithEmail(email, password, options = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
}

/**
 * Connexion via OAuth (Google, GitHub, LinkedIn)
 * @param {string} provider - 'google', 'github', 'linkedin'
 * @returns {Promise<{data: any, error: any}>}
 */
export async function loginWithOAuth(provider) {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
}

/**
 * Déconnexion de l'utilisateur
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Erreur lors de la déconnexion:', err);
    }
}

/**
 * Vérifie la session active
 * @returns {Promise<object|null>} Session object or null
 */
export async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (err) {
        console.error('Erreur vérification session:', err);
        return null;
    }
}

/**
 * Protège une page privée
 * Redirige vers login.html si aucun utilisateur n'est connecté
 * @returns {Promise<object|null>} Session object if authenticated
 */
export async function protectPrivatePage() {
    const session = await checkSession();
    if (!session) {
        // Sauvegarde l'URL actuelle pour redirection après login (optionnel)
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

/**
 * Affiche les informations de l'utilisateur dans le DOM
 * Recherche les éléments avec les classes .user-name, .user-email, .user-avatar
 * @param {object} user - User object from session
 */
export function displayUserInfo(user) {
    if (!user) return;

    const nameElements = document.querySelectorAll('.user-name');
    const emailElements = document.querySelectorAll('.user-email');
    const avatarElements = document.querySelectorAll('.user-avatar');

    const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    nameElements.forEach(el => el.textContent = fullName);
    emailElements.forEach(el => el.textContent = user.email);

    if (avatarUrl) {
        avatarElements.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = avatarUrl;
            } else {
                el.style.backgroundImage = `url('${avatarUrl}')`;
                el.textContent = ''; // Efface les initiales si image présente
            }
        });
    }
}

// Écouteur global des changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('Utilisateur connecté:', session.user.email);
        displayUserInfo(session.user);
    } else if (event === 'SIGNED_OUT') {
        console.log('Utilisateur déconnecté');
    }
});

// Initialisation automatique au chargement du DOM pour mettre à jour l'UI
document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkSession();
    if (session) {
        displayUserInfo(session.user);
    }
});