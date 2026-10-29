import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerProfile, QRCodeCard } from '../types';
import { storageService } from '../services/storage';
import { soundManager } from '../services/soundManager';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  FlipHorizontal, 
  Flashlight, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Award, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

interface QRScannerProps {
  player: PlayerProfile;
  onScanSuccess: (points: number, card: QRCodeCard, isNewRank?: boolean, newRankTitle?: string) => void;
  onNavigateToBook: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  player,
  onScanSuccess,
  onNavigateToBook,
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanResultModal, setScanResultModal] = useState<{
    show: boolean;
    success: boolean;
    points: number;
    title: string;
    message: string;
    isNewRank?: boolean;
    newRankTitle?: string;
  } | null>(null);

  const [availableCards, setAvailableCards] = useState<QRCodeCard[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  useEffect(() => {
    setAvailableCards(storageService.getQRCodes());
  }, []);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setHasCameraPermission(true);

      // Start BarcodeDetector loop if supported by browser (modern Chrome/Android/Edge)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as unknown as {
          BarcodeDetector: new (opts?: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
          };
        }).BarcodeDetector({ formats: ['qr_code'] });

        const checkFrame = async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleProcessScannedText(barcodes[0].rawValue);
                return;
              }
            } catch {
              // ignore frame errors
            }
          }
          scanLoopRef.current = requestAnimationFrame(checkFrame);
        };
        scanLoopRef.current = requestAnimationFrame(checkFrame);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScanning, startCamera, stopCamera]);

  // Trigger celebration explosion
  const triggerNenExplosion = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff88', '#00e5ff', '#ffd700', '#bd00ff', '#ffffff'],
    });
  };

  // Process any QR Code text
  const handleProcessScannedText = (scannedText: string) => {
    if (!scannedText) return;
    const result = storageService.processScan(scannedText, player);

    if (result.success && result.card) {
      soundManager.playScanSuccess();
      triggerNenExplosion();
      if (result.isNewRank) {
        setTimeout(() => soundManager.playRankUp(), 600);
      }
      setScanResultModal({
        show: true,
        success: true,
        points: result.points,
        title: result.card.title,
        message: result.message,
        isNewRank: result.isNewRank,
        newRankTitle: result.newRankTitle,
      });
      onScanSuccess(result.points, result.card, result.isNewRank, result.newRankTitle);
    } else {
      soundManager.playScanError();
      setScanResultModal({
        show: true,
        success: false,
        points: 0,
        title: 'Échec du Scan Nen',
        message: result.message,
      });
    }
  };

  // Handle image upload from file gallery (mobile camera photo or screenshot)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as unknown as {
              BarcodeDetector: new (opts?: { formats: string[] }) => {
                detect: (source: HTMLImageElement) => Promise<Array<{ rawValue: string }>>;
              };
            }).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await barcodeDetector.detect(img);
            if (barcodes.length > 0) {
              handleProcessScannedText(barcodes[0].rawValue);
              return;
            }
          } catch {}
        }
        // Fallback: search if file name or prompt matches
        alert('Impossible de décoder automatiquement l\'image sans BarcodeDetector. Tu peux taper ou cliquer sur un code de test ci-dessous !');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities?.() as { torch?: boolean };
      if (capabilities && 'torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
        });
        setTorchOn(!torchOn);
      }
    } catch {
      // Torch not supported on laptop/desktop
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      {/* Scanner Viewport */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-black border-2 border-hunter-neon/40 shadow-nen-green">
        {/* Video feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
          {/* Top Status */}
          <div className="flex items-center justify-between text-xs font-mono text-hunter-neon bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-hunter-neon/20">
            <span className="flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-hunter-neon" />
              NEN RADAR ACTIF
            </span>
            <span className="text-slate-400">HXH-SCANNER v2.0</span>
          </div>

          {/* Central Targeting Box */}
          <div className="relative self-center w-56 h-56 sm:w-64 sm:h-64 border-2 border-dashed border-hunter-neon/70 rounded-2xl flex items-center justify-center">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-hunter-neon" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-hunter-neon" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-hunter-neon" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-hunter-neon" />

            {/* Animated Laser Sweep Line */}
            <div className="absolute left-2 right-2 h-0.5 bg-hunter-neon scanner-laser" />

            {/* Target crosshair center */}
            <div className="w-8 h-8 rounded-full border border-hunter-neon/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-hunter-neon" />
            </div>

            <div className="absolute -bottom-7 text-[11px] font-mono text-slate-300 bg-black/80 px-2 py-0.5 rounded border border-white/10">
              Aligner le QR Code au centre
            </div>
          </div>

          {/* Bottom HUD info */}
          <div className="text-center text-[10px] text-slate-400 font-mono">
            FRÉQUENCE NEN: 98.4% • CONCENTRATION DU GYO
          </div>
        </div>

        {/* If camera is not allowed or blocked */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <Camera className="w-12 h-12 text-slate-500 mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Caméra non disponible ou bloquée</h4>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              Autorise l'accès à la caméra dans ton navigateur, ou utilise les boutons de test rapide et d'envoi d'image ci-dessous !
            </p>
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 bg-hunter-neon text-black font-bold text-xs rounded-xl shadow-lg hover:bg-hunter-neonHover transition"
            >
              Réessayer d'activer la caméra
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons (Flip Camera, Torch, Upload Image) */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          onClick={() => {
            setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
            soundManager.playUiClick();
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-hunter-card border border-white/10 hover:border-hunter-cyan text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <FlipHorizontal className="w-4 h-4 text-hunter-cyan" />
          <span>Changer Caméra</span>
        </button>

        <button
          onClick={toggleTorch}
          className="py-2.5 px-3 rounded-xl bg-hunter-card border border-white/10 hover:border-hunter-gold text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95"
          title="Lampe torche"
        >
          <Flashlight className={`w-4 h-4 ${torchOn ? 'text-hunter-gold animate-pulse' : 'text-slate-400'}`} />
          <span>Flash</span>
        </button>

        <label className="flex-1 py-2.5 px-3 rounded-xl bg-hunter-card border border-white/10 hover:border-hunter-neon text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95">
          <Upload className="w-4 h-4 text-hunter-neon" />
          <span>Importer Image</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Manual Code Input Option (For quick testing & fallback) */}
      <div className="p-4 rounded-2xl bg-hunter-card border border-white/10">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-hunter-neon" />
          Saisie Manuelle de Code (Secours & Test)
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessScannedText(manualCode);
            setManualCode('');
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ex: HXH-NUMERE-01"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-hunter-neon"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-hunter-neon text-black font-bold text-xs hover:bg-hunter-neonHover transition shadow active:scale-95"
          >
            Valider
          </button>
        </form>
      </div>

      {/* Quick Test Codes Simulation Drawer (Very handy for testing without printing!) */}
      <div className="p-4 rounded-2xl bg-hunter-card/70 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-hunter-gold" />
            Codes QR à tester immédiatement
          </span>
          <span className="text-[10px] text-slate-500">Clique pour simuler le scan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableCards.map((card) => {
            const isScanned = player.scannedCodeIds.includes(card.code);
            return (
              <button
                key={card.id}
                onClick={() => {
                  soundManager.playUiClick();
                  handleProcessScannedText(card.code);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  isScanned
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 hover:border-hunter-neon hover:bg-white/10 text-slate-200'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold truncate">{card.title}</div>
                  <div className="text-[10px] font-mono text-slate-400">{card.code}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black text-hunter-gold">+{card.points}pt</span>
                  {isScanned ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCAN RESULT CELEBRATION MODAL */}
      {scanResultModal?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 text-center border-2 shadow-2xl relative overflow-hidden ${
              scanResultModal.success
                ? 'bg-slate-900 border-hunter-neon shadow-nen-green'
                : 'bg-slate-900 border-rose-500/70 shadow-lg'
            }`}
          >
            {/* Holographic background sheen */}
            {scanResultModal.success && <div className="absolute inset-0 holo-shine opacity-30 pointer-events-none" />}

            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-lg relative">
              {scanResultModal.success ? (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-hunter-neon to-emerald-600 flex items-center justify-center text-black">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white">
                  <XCircle className="w-10 h-10 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Points Awarded Badge */}
            {scanResultModal.success && (
              <div className="inline-block px-4 py-1.5 rounded-full bg-hunter-neon/20 border border-hunter-neon text-hunter-neon font-display font-black text-xl mb-3 animate-bounce">
                +{scanResultModal.points} POINTS !
              </div>
            )}

            <h3 className="text-xl font-bold font-display text-white mb-2">
              {scanResultModal.title}
            </h3>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {scanResultModal.message}
            </p>

            {/* Rank Up Announcement */}
            {scanResultModal.isNewRank && (
              <div className="mb-4 p-3 rounded-xl bg-hunter-gold/20 border border-hunter-gold text-hunter-gold text-xs font-bold flex items-center justify-center gap-2">
                <Award className="w-4 h-4" />
                <span>PROMOTION HUNTER : {scanResultModal.newRankTitle} !</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setScanResultModal(null)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                Continuer à Scanner
              </button>
              {scanResultModal.success && (
                <button
                  onClick={() => {
                    setScanResultModal(null);
                    onNavigateToBook();
                  }}
                  className="flex-1 py-3 rounded-xl bg-hunter-neon hover:bg-hunter-neonHover text-black font-bold text-xs transition shadow-lg"
                >
                  Voir dans le Book
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
