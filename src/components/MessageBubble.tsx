import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { colors, radius, spacing } from '@/theme';
import type { Message } from '@/types';
import { formatMessageTime } from '@/utils/messages';

interface MessageBubbleProps {
  message: Message;
  mine: boolean;
  showSender: boolean;
  pending?: boolean;
  onLongPress?: () => void;
}

export function MessageBubble({
  message,
  mine,
  showSender,
  pending,
  onLongPress,
}: MessageBubbleProps) {
  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      {!mine &&
        (showSender ? (
          <Avatar username={message.username} color={message.avatarColor} size={34} />
        ) : (
          <View style={styles.avatarGap} />
        ))}
      <View style={styles.column}>
        {!mine && showSender ? (
          <Text style={styles.sender}>{message.username}</Text>
        ) : null}
        <Pressable
          onLongPress={mine ? onLongPress : undefined}
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleTheirs,
            pending && styles.pending,
          ]}
        >
          <Text style={[styles.body, mine && styles.bodyMine]}>{message.body}</Text>
        </Pressable>
        <Text style={[styles.time, mine && styles.timeMine]}>
          {pending ? 'enviando...' : formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: 4,
    maxWidth: '85%',
  },
  rowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatarGap: { width: 34 },
  column: { flexShrink: 1 },
  sender: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: { borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: spacing.md },
  bubbleMine: { backgroundColor: colors.bubbleMine, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.bubbleTheirs, borderBottomLeftRadius: 4 },
  pending: { opacity: 0.6 },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  bodyMine: { color: colors.onPrimary },
  time: { fontSize: 11, color: colors.muted, marginTop: 3, marginLeft: 4 },
  timeMine: { textAlign: 'right', marginRight: 4 },
});

