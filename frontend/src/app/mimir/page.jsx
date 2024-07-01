"use client";
import React from "react";
import ChatbotWithoutForm from "../layouts/ChatbotWithoutForm";
const Kitsune = () => {
  /**
   * Phase 1: ChatbotWithoutForm
   */
  return (
    <>
      <ChatbotWithoutForm
        emoji="🧙"
        headingText="Chapter 2"
        heading="Mimir AI"
        boldText="Retrieval Augmented Generation. Embeddings. Vector Stores."
        description="Chat with PDFs, code, or videos."
        debug={false}
        /** Base URL when using `chalice local` */
        // baseUrl="http://127.0.0.1:8000"
        baseUrl="https://npn9lcae22.execute-api.us-west-2.amazonaws.com/api/"
        botPngFile="wizard"
      />
    </>
  );
};

export default Kitsune;
