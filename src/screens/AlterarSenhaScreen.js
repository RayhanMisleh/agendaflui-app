import React, { useState } from "react";
import Toast from "react-native-toast-message";
import EntryLayout from "../components/entry/EntryLayout";
import Field from "../components/entry/Field";
import FormMessage from "../components/entry/FormMessage";
import Button from "../components/ui/Button";
import { changePassword } from "../api/me";
import { validatePassword } from "../utils/helpers";

export default function AlterarSenhaScreen({ navigation }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const found = {};
    if (!current) found.current = "Digite a senha atual.";
    if (!validatePassword(next)) found.next = "Use de 10 a 200 caracteres na senha.";
    if (repeat !== next) found.repeat = "As senhas não são iguais.";
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const submit = async () => {
    setMessage("");
    if (loading || !validate()) return;
    setLoading(true);
    try {
      await changePassword({ current, next });
      Toast.show({ type: "success", text1: "Senha trocada.", visibilityTime: 4000 });
      navigation.goBack();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EntryLayout title="Alterar senha" hint="Por segurança, você sai dos outros aparelhos." onBack={() => navigation.goBack()}>
      <FormMessage kind="error">{message}</FormMessage>
      <Field label="Senha atual" secure value={current} onChangeText={setCurrent} error={errors.current} autoCapitalize="none" autoComplete="current-password" textContentType="password" />
      <Field label="Senha nova" secure value={next} onChangeText={setNext} error={errors.next} hint="De 10 a 200 caracteres." autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" />
      <Field label="Repita a senha nova" secure value={repeat} onChangeText={setRepeat} error={errors.repeat} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" onSubmitEditing={submit} />
      <Button title="Alterar senha" onPress={submit} loading={loading} fullWidth size="lg" />
    </EntryLayout>
  );
}
