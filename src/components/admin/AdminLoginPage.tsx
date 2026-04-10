"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { loginAdmin } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import styles from "./AdminDashboardPage.module.css";

interface LoginFormState {
  username: string;
  password: string;
}

const INITIAL_LOGIN_FORM: LoginFormState = {
  password: "",
  username: "",
};

export function AdminLoginPage() {
  const [loginForm, setLoginForm] = useState<LoginFormState>(INITIAL_LOGIN_FORM);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function updateLoginField(field: keyof LoginFormState, value: string) {
    setLoginForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);

    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError("Username and password are required.");
      return;
    }

    try {
      setIsLoggingIn(true);

      const response = await loginAdmin({
        password: loginForm.password,
        username: loginForm.username.trim(),
      });

      if (response.authenticated) {
        window.location.href = "/admin";
        return;
      }

      setLoginError("Invalid credentials.");
    } catch (error) {
      if (isApiError(error)) {
        setLoginError(error.message);
      } else {
        setLoginError("Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginBox}>
        <div className={styles.loginLogoWrap}>
          <Image
            alt="Foundry logo"
            height={48}
            priority
            src="/logo.svg"
            style={{ height: "auto" }}
            width={52}
          />
          <span className={styles.loginLogoText}>FOUNDRY</span>
        </div>
        <h1 className={styles.loginTitle}>Admin Sign In</h1>
        <p className={styles.loginSubtitle}>
          Sign in to review found item submissions and ownership claims.
        </p>

        <Card className={styles.loginCard}>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <Input
              autoComplete="username"
              label="Username"
              onChange={(event) => updateLoginField("username", event.target.value)}
              required
              value={loginForm.username}
            />
            <Input
              autoComplete="current-password"
              label="Password"
              onChange={(event) => updateLoginField("password", event.target.value)}
              required
              type="password"
              value={loginForm.password}
            />

            {loginError ? (
              <p className={styles.errorText} role="alert">
                {loginError}
              </p>
            ) : null}

            <Button loading={isLoggingIn} size="lg" type="submit">
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
