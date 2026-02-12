import React from "react";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { NextUIProvider } from "@nextui-org/react";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import { ConfirmPromptProvider } from "../providers/ConfirmPromptProvider";
import { M_PLUS_2 } from "next/font/google";

const mplus2 = M_PLUS_2({
  weight: ["400", "700"],
  subsets: ["vietnamese"],
  display: "swap",
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={mplus2.className}>
      <NextUIProvider>
        <ConfirmPromptProvider>
          <Component {...pageProps} />
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </ConfirmPromptProvider>
      </NextUIProvider>
    </main>
  );
}

export default MyApp;
