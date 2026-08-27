import { useRef } from 'react';

interface Options {
  autoPlay?: boolean;
}
export default function useAudioComponent(options: Options) {
  const { autoPlay } = options;
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return {
    videoContext: (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio ref={videoRef} autoPlay={autoPlay} loop>
        <source src="./audio/tip.mp3" type="audio/mpeg" />
      </audio>
    ),
    play,
    pause,
  };
}
