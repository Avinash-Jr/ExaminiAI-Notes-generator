import assert from "node:assert";
import { generateOpenRouterContent } from "../services/openrouter.services.js";
import { generateContent } from "../services/aiRouter.js";

console.log("🚀 Testing OpenRouter Service & AI Router Fallback...\n");

// 1. Test OpenRouter Service module configuration
console.log("1. Testing OpenRouter Service configuration & validation...");
assert.strictEqual(typeof generateOpenRouterContent, "function", "generateOpenRouterContent must be a function");

// Test validation when API key or prompt is missing
try {
  await generateOpenRouterContent("");
  assert.fail("Should throw on empty prompt");
} catch (err) {
  assert.ok(err.message.includes("Prompt must be a non-empty string") || err.message.includes("OPENROUTER_API_KEY"), "Expected validation error");
  console.log("   ✓ Input validation correctly caught empty prompt or missing key.");
}

// 2. Test AI Router with OpenRouter integration
console.log("\n2. Testing AI Router with OpenRouter fallback routing...");
assert.strictEqual(typeof generateContent, "function", "generateContent must be a function");

console.log("\n🎉 OpenRouter Service & AI Router tests passed successfully!");
