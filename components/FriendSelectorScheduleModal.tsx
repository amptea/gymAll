import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function FriendSelectorModal({
  visible,
  onClose,
  friends,
  selectedFriends,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  friends: { uid: string; displayName: string }[];
  selectedFriends: string[];
  onSelect: (selected: string[]) => void;
}) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedFriends);

  const toggleFriend = (uid: string) => {
    setLocalSelected(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleConfirm = () => {
    onSelect(localSelected);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Select Friends</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            {friends.length === 0 ? (
              <Text style={styles.noFriendsText}>No friends available.</Text>
            ) : (
              friends.map(friend => (
                <TouchableOpacity
                  key={friend.uid}
                  onPress={() => toggleFriend(friend.uid)}
                  style={styles.friendRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, localSelected.includes(friend.uid) && styles.checkboxSelected]}>
                    {localSelected.includes(friend.uid) && (
                      <MaterialIcons name="check" size={16} color="#000" />
                    )}
                  </View>
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '70%',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  closeButton: {
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  noFriendsText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 34, 34, 1)',
  },
  checkbox: {
    width: 22,
    height: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ff9a02',
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ff9a02',
    borderColor: '#ff9a02',
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: {
    color: '#ff9a02',
    fontSize: 16,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#ff9a02',
  },
  confirmText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
