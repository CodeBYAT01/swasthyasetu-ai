import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card className="w-full max-w-lg">
        <EmptyState icon={Compass} title="Page not found" description="This page does not exist in the demonstration build." action={<Button onClick={() => navigate('/app/overview')}>Go to overview</Button>} />
      </Card>
    </div>
  );
}
