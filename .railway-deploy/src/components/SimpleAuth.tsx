import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { User } from "@/types";
import { useState } from "react";

interface SimpleAuthProps {
  onSuccess: (user: User) => void;
}

export function SimpleAuth({ onSuccess }: Readonly<SimpleAuthProps>) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  const handleLogin = () => {
    // Login simples: usuário "adm" e senha "adm123"
    if (username === "adm" && password === "adm123") {
      const user: User = {
        id: "local-admin",
        email: "admin@local",
        name: "Administrador",
        avatarUrl: "",
        role: "admin",
      };
      onSuccess(user);
    } else {
      setError("Credenciais inválidas. Use usuário 'adm' e senha 'adm123'.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login Simples</CardTitle>
        <CardDescription>Entre com credenciais locais</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            name="username"
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Usuário"
            data-testid="login-username"
            autoComplete="username"
          />
          <Input
            name="password"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Senha"
            data-testid="login-password"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" data-testid="login-submit">
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
