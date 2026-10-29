import React, { useState, useEffect } from 'react';
import { sound } from '../services/sound';

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '450178803458-kc451f46rt4lg58kp9jk7euodog9s0a4.apps.googleusercontent.com';

interface EmailAuthModalProps {
  isOpen: boolean;
  onRegister: (email: string, name?: string) => Promise<void>;
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({
  isOpen,
  onRegister
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSuccess = async (email: string, name?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onRegister(email, name);
      sound.playSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement de la Licence Hunter.");
      sound.playError();
      setIsLoading(false);
    }
  };

  // 1. Initialisation Google One Tap en arrière-plan (connexion automatique sans clic si session Google active)
  useEffect(() => {
    if (!isOpen) return;

    let checkTimer: NodeJS.Timeout | null = null;

    const setupGoogle = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response && response.credential) {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                if (payload && payload.email) {
                  // Extraction automatique du vrai nom du propriétaire du compte Google
                  const ownerName = payload.name || payload.given_name || payload.preferred_username || '';
                  await handleSuccess(payload.email, ownerName);
                }
              } catch (e) {
                console.error('Erreur décodage JWT Google:', e);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false
        });

        // Déclencher discrètement One Tap
        google.accounts.id.prompt();
      } catch (err) {
        console.warn('Google GSI Init:', err);
      }
    };

    if ((window as any).google?.accounts?.id) {
      setupGoogle();
    } else {
      checkTimer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          if (checkTimer) clearInterval(checkTimer);
          setupGoogle();
        }
      }, 200);
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 2. Bouton Unique de Connexion Google (Popup de sélection de compte)
  const handleSingleGoogleLogin = () => {
    sound.playClick();
    setErrorMsg(null);

    const google = (window as any).google;
    if (google?.accounts?.oauth2) {
      try {
        setIsLoading(true);
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userinfo = await res.json();
                if (userinfo && userinfo.email) {
                  // Extraction du vrai nom officiel du propriétaire du compte Google
                  const ownerName = userinfo.name || userinfo.given_name || '';
                  await handleSuccess(userinfo.email, ownerName);
                  return;
                }
              } catch (e) {
                setErrorMsg('Échec de la récupération des données Google. Veuillez réessayer.');
              }
            }
            setIsLoading(false);
          },
          error_callback: () => {
            setErrorMsg('Sélection du compte annulée.');
            setIsLoading(false);
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        setIsLoading(false);
      }
    } else if (google?.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      setErrorMsg('Chargement des services Google en cours... Veuillez patienter.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 4, 10, 0.94)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 390,
          width: '100%',
          padding: '34px 26px',
          borderColor: 'var(--hunter-cyan)',
          boxShadow: '0 0 40px rgba(0, 242, 254, 0.25)',
          background: 'linear-gradient(145deg, #070d18 0%, #03060c 100%)',
          borderRadius: 12,
          textAlign: 'center'
        }}
      >
        {/* Hunter Badge */}
        <div style={{ fontSize: 38, marginBottom: 8 }}>⚔️</div>

        <h2
          style={{
            fontFamily: 'var(--font-hxh)',
            fontSize: 22,
            letterSpacing: 2,
            color: '#fff',
            marginBottom: 4
          }}
        >
          EXAMEN HUNTER 2026
        </h2>
        <div
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 10,
            color: 'var(--hunter-cyan)',
            letterSpacing: 1.5,
            marginBottom: 20,
            textTransform: 'uppercase'
          }}
        >
          OBTENTION DE LA LICENCE OFFICIELLE
        </div>

        {/* Note informative */}
        <div
          style={{
            background: 'rgba(0, 240, 118, 0.08)',
            border: '1px solid rgba(0, 240, 118, 0.3)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 24,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--hunter-green)',
              marginBottom: 4,
              letterSpacing: 1
            }}
          >
            ★ AUTHENTIFICATION 1-CLIC
          </div>
          <p
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 9.5,
              color: '#f0f0f0',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            Votre vrai nom et votre adresse email sont automatiquement associés depuis votre compte Google en un seul clic.
          </p>
        </div>

        {/* Bouton UNIQUE de Connexion Google */}
        <button
          onClick={handleSingleGoogleLogin}
          disabled={isLoading}
          id="btn-google-login-single"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: '#ffffff',
            color: '#1f1f1f',
            border: 'none',
            borderRadius: 30,
            padding: '14px 20px',
            fontFamily: 'Roboto, sans-serif, system-ui',
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoading ? 'wait' : 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.8 : 1
          }}
          onMouseEnter={e => {
            if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            if (!isLoading) e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Logo Officiel Google Vectoriel */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}</span>
        </button>

        {/* Message d'erreur clair si besoin */}
        {errorMsg && (
          <div
            style={{
              color: 'var(--hunter-danger)',
              fontSize: 10,
              fontFamily: 'var(--font-code)',
              marginTop: 14,
              lineHeight: 1.4,
              background: 'rgba(255,68,68,0.1)',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid rgba(255,68,68,0.3)',
              textAlign: 'center'
            }}
          >
            ⚠ {errorMsg}
          </div>
        )}

        <div className="ldc-footer-credit" style={{ marginTop: 24 }}>
          <span className="dot">✦</span> LDC CLUB ESTIN <span className="dot">✦</span>
        </div>
      </div>
    </div>
  );
};
export default EmailAuthModal;
