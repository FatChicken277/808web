import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function AudioPlayer({ tracks = [] }: { tracks?: string[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [siteEntered, setSiteEntered] = useState(false);

  const audioRef1 = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stateRef = useRef({
    playlist: [] as string[],
    currentIndex: 0,
    activePlayer: 1 as 1 | 2,
    userPaused: false,
    hasInteracted: false,
    systemPaused: false
  });

  // Prevenir scroll mientras está la pantalla de inicio
  useEffect(() => {
    if (!siteEntered) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [siteEntered]);

  // Inicializar playlist mezclada
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      stateRef.current.playlist = shuffleArray(tracks);
    }
  }, [tracks]);

  // Función para manejar el crossfade suave
  const crossfadeToNext = useCallback(() => {
    const state = stateRef.current;
    if (state.playlist.length === 0) return;

    const activeAudio =
      state.activePlayer === 1 ? audioRef1.current : audioRef2.current;
    const nextAudio =
      state.activePlayer === 1 ? audioRef2.current : audioRef1.current;

    if (!activeAudio || !nextAudio) return;

    let nextIndex = state.currentIndex + 1;
    let nextPlaylist = state.playlist;

    // Mezclar de nuevo si llegamos al final, evitando repetir la última
    if (nextIndex >= state.playlist.length) {
      nextPlaylist = shuffleArray(tracks);
      if (
        nextPlaylist.length > 1 &&
        nextPlaylist[0] === state.playlist[state.playlist.length - 1]
      ) {
        [nextPlaylist[0], nextPlaylist[1]] = [nextPlaylist[1], nextPlaylist[0]];
      }
      state.playlist = nextPlaylist;
      nextIndex = 0;
    }

    nextAudio.src = nextPlaylist[nextIndex];
    nextAudio.volume = 0;

    nextAudio.onloadedmetadata = () => {
      const duration = nextAudio.duration;
      if (duration > 20) {
        const minStart = duration * 0.3;
        const maxStart = duration * 0.7;
        nextAudio.currentTime =
          Math.random() * (maxStart - minStart) + minStart;
      }

      nextAudio
        .play()
        .then(() => {
          if (crossfadeIntervalRef.current)
            clearInterval(crossfadeIntervalRef.current);

          let vol = 0;
          // Hacemos el fade más largo y lento (2 segundos = 20 pasos de 100ms)
          const step = 0.5 / 20;

          crossfadeIntervalRef.current = setInterval(() => {
            vol += step;
            if (vol >= 0.5) {
              if (crossfadeIntervalRef.current)
                clearInterval(crossfadeIntervalRef.current);
              nextAudio.volume = 0.5;
              activeAudio.pause();
              activeAudio.volume = 0;

              // Actualizar estado para la próxima ronda
              state.activePlayer = state.activePlayer === 1 ? 2 : 1;
              state.currentIndex = nextIndex;

              if (timerRef.current) clearTimeout(timerRef.current);
              // Reproducir por 8 segundos y luego iniciar crossfade de 2s
              timerRef.current = setTimeout(crossfadeToNext, 8000);
            } else {
              nextAudio.volume = vol;
              // Desvanecer el activo un poco más rápido para evitar un pico de volumen alto
              activeAudio.volume = Math.max(0, 0.5 - vol * 1.5);
            }
          }, 100);
        })
        .catch((e) => console.log("Crossfade play prevented", e));
    };

    nextAudio.load();
  }, [tracks]);

  const startPlayback = useCallback(() => {
    const state = stateRef.current;
    if (state.playlist.length === 0) return;

    const activeAudio =
      state.activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (!activeAudio) return;

    activeAudio.src = state.playlist[state.currentIndex];
    activeAudio.volume = 0;

    activeAudio.onloadedmetadata = () => {
      const duration = activeAudio.duration;
      if (duration > 20) {
        const minStart = duration * 0.3;
        const maxStart = duration * 0.7;
        activeAudio.currentTime =
          Math.random() * (maxStart - minStart) + minStart;
      }

      activeAudio
        .play()
        .then(() => {
          setIsPlaying(true);
          if (crossfadeIntervalRef.current)
            clearInterval(crossfadeIntervalRef.current);

          let vol = 0;
          crossfadeIntervalRef.current = setInterval(() => {
            vol += 0.05;
            if (vol >= 0.5) {
              activeAudio.volume = 0.5;
              if (crossfadeIntervalRef.current)
                clearInterval(crossfadeIntervalRef.current);
            } else {
              activeAudio.volume = vol;
            }
          }, 100);

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(crossfadeToNext, 8000);
        })
        .catch((e) => console.log("Start play prevented", e));
    };

    activeAudio.load();
  }, [crossfadeToNext]);

  // Global Interaction Handler
  useEffect(() => {
    const handleInteraction = () => {
      const state = stateRef.current;
      if (
        state.userPaused ||
        state.systemPaused ||
        isPlaying ||
        state.hasInteracted ||
        state.playlist.length === 0
      )
        return;
      state.hasInteracted = true;
      startPlayback();
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("scroll", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [isPlaying, startPlayback]);

  // Manejador para Pausa de Sistema (cuando se abre un modal de video)
  useEffect(() => {
    const handleSystemPause = () => {
      const state = stateRef.current;
      const activeAudio = state.activePlayer === 1 ? audioRef1.current : audioRef2.current;
      if (activeAudio && isPlaying) {
        activeAudio.pause();
        setIsPlaying(false);
        state.systemPaused = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
      }
    };

    const handleSystemResume = () => {
      const state = stateRef.current;
      if (state.systemPaused && !state.userPaused) {
        state.systemPaused = false;
        const activeAudio = state.activePlayer === 1 ? audioRef1.current : audioRef2.current;
        if (activeAudio) {
          activeAudio.play().then(() => {
            setIsPlaying(true);
            activeAudio.volume = 0.5;
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(crossfadeToNext, 8000);
          }).catch(e => console.log(e));
        }
      }
    };

    window.addEventListener('system-audio-pause', handleSystemPause);
    window.addEventListener('system-audio-resume', handleSystemResume);

    return () => {
      window.removeEventListener('system-audio-pause', handleSystemPause);
      window.removeEventListener('system-audio-resume', handleSystemResume);
    };
  }, [isPlaying, crossfadeToNext]);

  const togglePlay = () => {
    const state = stateRef.current;
    const activeAudio =
      state.activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (!activeAudio) return;

    if (isPlaying) {
      activeAudio.pause();
      setIsPlaying(false);
      state.userPaused = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (crossfadeIntervalRef.current)
        clearInterval(crossfadeIntervalRef.current);
    } else {
      state.userPaused = false;
      state.hasInteracted = true;

      activeAudio
        .play()
        .then(() => {
          setIsPlaying(true);
          activeAudio.volume = 0.5;
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(crossfadeToNext, 8000);
        })
        .catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (crossfadeIntervalRef.current)
        clearInterval(crossfadeIntervalRef.current);
    };
  }, []);

  const handleEnterSite = () => {
    setSiteEntered(true);
    const state = stateRef.current;
    if (!isPlaying && state.playlist.length > 0 && !state.systemPaused) {
      state.hasInteracted = true;
      startPlayback();
    }
  };

  return (
    <>
      {/* Pantalla de Entrada */}
      <div
        onClick={!siteEntered ? handleEnterSite : undefined}
        className={`fixed inset-0 z-9999999 bg-black flex flex-col items-center justify-center cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.7,0,0.3,1)] ${
          siteEntered
            ? "opacity-0 scale-[1.5] pointer-events-none"
            : "opacity-100 scale-100"
        }`}
      >
        <div
          className={`text-center transition-all duration-1000 ${siteEntered ? "opacity-0 scale-[1.2]" : "animate-[pulse_3s_ease-in-out_infinite]"}`}
        >
          <h1 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]">
            [808 FEST]
          </h1>
          <p className="text-[#39FF14] text-sm md:text-base font-mono tracking-[0.3em] uppercase">
            Toca para entrar
          </p>
        </div>
      </div>

      {/* Reproductor Flotante */}
      <div
        className={`fixed bottom-6 right-6 z-99999 transition-opacity duration-1000 ${siteEntered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <audio ref={audioRef1} />
        <audio ref={audioRef2} />

        <button
          onClick={togglePlay}
          className="bg-black/60 backdrop-blur-md border border-white/20 hover:border-[#39FF14] text-white p-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:scale-110 flex items-center justify-center cursor-pointer group"
          aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
        >
          {isPlaying ? (
            <Volume2
              size={20}
              className="text-[#39FF14] group-hover:text-[#39FF14] transition-colors"
            />
          ) : (
            <VolumeX
              size={20}
              className="text-white/60 group-hover:text-white transition-colors"
            />
          )}
        </button>
      </div>
    </>
  );
}
