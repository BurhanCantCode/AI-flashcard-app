"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignedIn, SignedOut, useAuth, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ui/togglemode";
import { useState, useEffect } from "react";
import { doc, collection, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import getStripe from '@/lib/get-stripe';
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const handleCheckout = async (plan) => {
  try {
    const stripe = await getStripe();

    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          { name: `${plan} Plan`, price: plan === 'Basic' ? 500 : 1000, quantity: 1 },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { id } = await response.json();
    await stripe.redirectToCheckout({ sessionId: id });
  } catch (error) {
    console.error('Error during checkout:', error);
    alert(`There was an error during checkout: ${error.message}`);
  }
};

export default function Home() {
  const { isSignedIn, user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [collectionsCount, setCollectionsCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn && user) {
      async function fetchUserData() {
        try {
          const docRef = doc(collection(db, "users"), user.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const count = userData.flashcards?.length || 0;
            setCollectionsCount(count);
            setUserPlan(userData.plan || 'free');
            console.log(`Collections Count: ${count}`);
            console.log(`User Plan: ${userData.plan || 'free'}`);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      fetchUserData();
    }
  }, [isSignedIn, user]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      if (collectionsCount >= 5 && userPlan === 'free') {
        console.log('Showing dialog because collections count is 5 and plan is free.');
        setShowDialog(true);
      } else {
        console.log('Redirecting to /generate');
        router.push("/generate");
      }
    } else {
      console.log('Redirecting to /sign-in');
      router.push("/sign-in");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <main className="flex-1">
        <section className="py-20 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">Welcome to AI Flash</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            The easiest method to create your flashcards from your documents
          </p>
          <Button size="lg" onClick={handleGetStarted}>Get Started</Button>
        </section>

        <section className="py-20">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Easy Input</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply input your document and let the software turn it into the
                  ideal test flashcards for you!
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Smart Flashcards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Test your knowledge from the documents and powerpoints, with
                  flashcards on any concept!
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Accessible Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Learn from anywhere, at anytime!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Basic</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-4 text-3xl font-bold">$5 / month</h3>
                <p className="mb-6 text-muted-foreground">
                  Access to basic card features and limited storage
                </p>
                <Button onClick={() => handleCheckout('Basic')} className="w-full">Choose Basic</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-4 text-3xl font-bold">$10 / month</h3>
                <p className="mb-6 text-muted-foreground">
                  Unlimited flashcards and storage with priority support
                </p>
                <Button onClick={() => handleCheckout('Pro')} className="w-full">Choose Pro</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Dialog open={showDialog} onOpenChange={(isOpen) => !isOpen && setShowDialog(false)}>
        <DialogContent>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <p className="mb-4">
            You've reached the limit of 5 flashcards. To create more, please upgrade your plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Basic</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-4 text-3xl font-bold">$5 / month</h3>
                <p className="mb-6 text-muted-foreground">
                  Access to basic card features and limited storage
                </p>
                <Button onClick={() => handleCheckout('Basic')} className="w-full">Choose Basic</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-4 text-3xl font-bold">$10 / month</h3>
                <p className="mb-6 text-muted-foreground">
                  Unlimited flashcards and storage with priority support
                </p>
                <Button onClick={() => handleCheckout('Pro')} className="w-full">Choose Pro</Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
