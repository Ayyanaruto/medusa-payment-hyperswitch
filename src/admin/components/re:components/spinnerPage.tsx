import { Container } from "@medusajs/ui";
const LoadingScreen: React.FC = () => {
  const shapeSize = 48; // Size in pixels
  const shapeColor = "rgb(1, 111, 252)";

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex space-x-8">
        <div className="animate-bounce">
          <svg width={shapeSize} height={shapeSize} viewBox="0 0 48 48">
            <polygon points="24,0 0,48 48,48" fill={shapeColor} />
          </svg>
        </div>
        <div className="animate-bounce" style={{ animationDelay: "0.1s" }}>
          <div
            style={{
              width: `${shapeSize}px`,
              height: `${shapeSize}px`,
              backgroundColor: shapeColor,
            }}
          ></div>
        </div>
        <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
          <svg width={shapeSize} height={shapeSize}>
            <circle
              cx={shapeSize / 2}
              cy={shapeSize / 2}
              r={shapeSize / 2}
              fill={shapeColor}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const SpinnerPage = () => (
  <Container className="flex items-center justify-center h-screen bg-white">
    <LoadingScreen />
  </Container>
);

export default SpinnerPage;
