"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmActionButton({
  confirmText,
  children,
  ...props
}: ButtonProps & { confirmText: string }) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
