import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  isMember: boolean;
  onPress: () => void;
}

export function RoomCard({ room, isMember, onPress }: RoomCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{room.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {room.name}
        </Text>
        {room.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {room.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="people" size={13} color={colors.muted} />
          <Text style={styles.meta}>{room.memberCount ?? 0}</Text>
          {isMember ? <Text style={styles.memberBadge}>Você participa</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  emojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  description: { fontSize: 14, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { fontSize: 13, color: colors.muted },
  memberBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});

