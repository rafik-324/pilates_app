import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  /** Ergebnis von require(...) aus media.generated.ts */
  source: number;
  style?: ViewStyle;
  paused?: boolean;
  accessibilityLabel?: string;
};

/** Übungsvideo in Schleife, stumm (/F400/). */
export function LoopVideo({ source, style, paused, accessibilityLabel }: Props) {
  const { colors, radius } = useTheme();
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [paused, player]);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
        style,
      ]}
    >
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsPictureInPicture={false}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
