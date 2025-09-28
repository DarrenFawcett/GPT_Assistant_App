import AssistantUI from "./gpt-assistant-ui";

console.log("ALL ENVS =", import.meta.env);

export default function App() {
  console.log('VITE_API_BASE =', import.meta.env.VITE_API_BASE);
  return <AssistantUI />;
}

console.log("TEST_KEY =", import.meta.env.VITE_TEST_KEY);
