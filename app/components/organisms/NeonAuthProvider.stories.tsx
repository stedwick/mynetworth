import { NeonAuthProvider } from "./NeonAuthProvider";

const containerStyle = {
  padding: "16px",
  border: "1px dashed #d4d4d8",
} as const;

const meta = {
  title: "Auth/NeonAuthProvider",
  component: NeonAuthProvider,
};

export default meta;

export const Default = {
  render: () => (
    <NeonAuthProvider>
      <div style={containerStyle}>NeonAuthProvider slot</div>
    </NeonAuthProvider>
  ),
};
