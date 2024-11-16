import { Container } from "@medusajs/ui";
import { Spinner } from "@medusajs/icons";


const SpinnerPage = () => (
    <Container className="flex justify-center items-center h-full">
        <Spinner className="animate-spin" />
    </Container>
    );

    export default SpinnerPage;