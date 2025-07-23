// components/CommonForm.js
import { View, Text, TextInput, StyleSheet, Button } from "react-native";

const CommonForm = ({
  formControls,
  formData,
  setFormData,
  handleSubmit,
  buttonText,
  isButtonDisabled,
}) => {
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <View style={styles.formContainer}>
      {formControls.map((field) => (
        <View key={field.name} style={styles.inputGroup}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={formData[field.name]}
            onChangeText={(text) => handleInputChange(field.name, text)}
            placeholder={field.placeholder}
            secureTextEntry={field.type === "password"}
            keyboardType={
              field.type === "email"
                ? "email-address"
                : field.type === "tel"
                ? "phone-pad"
                : "default"
            }
            autoCapitalize="none"
          />
        </View>
      ))}

      <Button
        title={buttonText}
        onPress={handleSubmit}
        disabled={isButtonDisabled}
        color={isButtonDisabled ? "#ccc" : "#007aff"}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  formContainer: {
    width: "100%",
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});

export default CommonForm;
