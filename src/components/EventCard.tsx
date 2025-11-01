import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  is_public: boolean;
  organizer_name: string;
  rsvp_count?: number;
}

export function EventCard({
  id,
  title,
  description,
  location,
  start_time,
  is_public,
  organizer_name,
  rsvp_count = 0,
}: EventCardProps) {
  return (
    <Link to={`/events/${id}`}>
      <Card className="h-full transition-all hover:shadow-medium hover:scale-[1.02] cursor-pointer">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-xl line-clamp-2">{title}</h3>
            {!is_public && <Badge variant="secondary">Private</Badge>}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{format(new Date(start_time), "PPp")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <span>by {organizer_name}</span>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{rsvp_count}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
