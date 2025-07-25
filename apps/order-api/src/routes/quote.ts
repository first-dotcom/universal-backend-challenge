import express from "express";
import logger from "shared/lib/logger";
import { QuoteRequest } from "universal-sdk";
import { z } from "zod";
import { ALLOWED_BLOCKCHAINS, ALLOWED_TOKENS, addressRegex } from "../config";
import quoteService from "../services/quote";

const router: express.Router = express.Router();

// Zod schema for QuoteRequest validation
const QuoteRequestSchema = z
  .object({
    type: z.enum(["BUY", "SELL"]),
    token: z.enum(ALLOWED_TOKENS),
    pair_token: z.union([
      z.literal("USDC"),
      z.string().regex(addressRegex, "Invalid token address"),
    ]),
    pair_token_amount: z.string().optional(),
    blockchain: z.enum(ALLOWED_BLOCKCHAINS),
    user_address: z.string().regex(addressRegex, "Invalid user address"),
    slippage_bips: z
      .number()
      .min(0, "Slippage must be positive")
      .max(10000, "Slippage must be less than 10000 bips")
      .optional(),
    token_amount: z.string().optional(),
  })
  .refine((data) => data.token_amount || data.pair_token_amount, {
    message: "Either token_amount or pair_token_amount must be provided",
    path: ["token_amount", "pair_token_amount"],
  });

// GET /quote - Get a quote using dummy data (kept for backwards compatibility)
router.get("/", async (req, res) => {
  try {
    logger.info("Processing quote request with dummy data");

    // Create dummy quote request
    const dummyQuoteRequest = quoteService.createDummyQuoteRequest();

    // Get quote from universal service
    const quote = await quoteService.getQuote(dummyQuoteRequest);

    logger.info("Quote request processed successfully");
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error("Quote request failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quote",
    });
  }
});

// POST /quote - Get a quote using real request data
router.post("/", async (req, res) => {
  try {
    logger.info("Processing quote request with real data");

    // Validate request body using zod
    const validationResult = QuoteRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn("Invalid quote request data:", validationResult.error.issues);
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validationResult.error.issues,
      });
    }

    const quoteRequest = validationResult.data as QuoteRequest;

    // Get quote from universal service
    const quote = await quoteService.getQuote(quoteRequest);

    logger.info("Quote request processed successfully");
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error("Quote request failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quote",
    });
  }
});

export default router;
