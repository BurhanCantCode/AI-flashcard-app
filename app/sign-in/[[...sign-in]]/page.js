import { Button } from "@/components/ui/button";
import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      <SignIn/>
    </div>
  );
}
