import { SignUp } from "@clerk/nextjs";
import React from "react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      {/* <Button>
        <Link href="/sign-up" passHref>SignUP</Link> 
      </Button>  */}
      <SignUp />
    </div>
  );
}
