import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profilePicture: string | null;
  showImagePickerOptions: () => void;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  weight: number;
  setWeight: (weight: number) => void;
  onSave: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  profilePicture,
  showImagePickerOptions,
  name,
  setName,
  username,
  setUsername,
  weight,
  setWeight,
  onSave,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.editModalHeader}>
              <TouchableOpacity
                onPress={onClose}
                style={{ marginRight: 12, paddingLeft: 16 }}
              >
                <MaterialIcons
                  name="close"
                  size={28}
                  color="rgba(255, 255, 255, 1)"
                />
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <View style={{ width: 28, marginLeft: 12 }} />
            </View>
            <ScrollView
              contentContainerStyle={styles.editModalContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.editProfilePictureSection}>
                <TouchableOpacity
                  style={styles.editProfilePictureContainer}
                  onPress={showImagePickerOptions}
                >
                  {profilePicture ? (
                    <Image
                      source={{ uri: profilePicture }}
                      style={styles.editProfilePicture}
                    />
                  ) : (
                    <View style={styles.editProfilePicturePlaceholder}>
                      <MaterialIcons
                        name="person"
                        size={32}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={showImagePickerOptions}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
              <View>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="Name"
                  placeholderTextColor="rgba(170,170,170,1)"
                  value={name}
                  onChangeText={setName}
                />
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="Username"
                  placeholderTextColor="rgba(170,170,170,1)"
                  value={username}
                  onChangeText={setUsername}
                />
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder={weight ? weight.toString() : "Set Weight"}
                  placeholderTextColor="rgba(170,170,170,1)"
                  value={weight ? weight.toString() : ""}
                  keyboardType="numeric"
                  onChangeText={(text) => setWeight(Number(text))}
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "80%",
    backgroundColor: "rgba(0, 0, 0, 1)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  editModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    marginTop: 10,
  },
  editModalTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    padding: 24,
  },
  editProfilePictureSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  editProfilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(34, 34, 34, 1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(51, 51, 51, 1)",
  },
  editProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfilePicturePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  editInput: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(34, 34, 34, 1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 51, 51, 1)",
    color: "rgba(255, 255, 255, 1)",
    paddingRight: 40,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "rgba(255, 154, 2, 1)",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "rgb(0, 0, 0)",
    fontSize: 16,
    fontWeight: "bold",
  },
});
