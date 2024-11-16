"use client";
import { Container, Label, Text } from "@medusajs/ui";

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode; }) => (
  <Container className={`col-span-5`}>
    <Label id={label}>{label}</Label>
    {children}
    {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
  </Container>
);

export default FormField;
