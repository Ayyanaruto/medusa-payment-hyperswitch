
'use client';
import {
  Container,
  Label,
  Text,

} from '@medusajs/ui';

const FormField = ({ label, error, children,span=5 }) => (
  <Container className={`col-span-${span}`}>
    <Label id={label}>{label}</Label>
    {children}
    {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
  </Container>
);

export default FormField;
