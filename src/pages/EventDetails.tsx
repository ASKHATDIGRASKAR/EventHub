import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Calendar, MapPin, User, Edit, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().trim().min(10, "Review must be at least 10 characters").max(1000),
});

interface EventDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_public: boolean;
  organizer_id: string;
  organizer: {
    full_name: string;
  };
  rsvps: Array<{
    id: string;
    status: string;
    user_id: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    user_id: string;
    user: {
      full_name: string;
    };
    created_at: string;
  }>;
}

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRsvp, setUserRsvp] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(full_name),
          rsvps(id, status, user_id),
          reviews(id, rating, comment, user_id, created_at, user:profiles!reviews_user_id_fkey(full_name))
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data);

      if (user) {
        const myRsvp = data.rsvps.find((r: any) => r.user_id === user.id);
        setUserRsvp(myRsvp?.status || null);
      }
    } catch (error) {
      toast.error("Failed to load event");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (status: "going" | "maybe" | "not_going") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      if (userRsvp) {
        const { error } = await supabase
          .from("rsvps")
          .update({ status })
          .eq("event_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rsvps")
          .insert([{ event_id: id, user_id: user.id, status }]);

        if (error) throw error;
      }

      setUserRsvp(status);
      toast.success(`RSVP updated to: ${status}`);
      fetchEvent();
    } catch (error) {
      toast.error("Failed to update RSVP");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      toast.success("Event deleted successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }

    setSubmittingReview(true);

    try {
      const validated = reviewSchema.parse({ rating, comment });

      const { error } = await supabase.from("reviews").insert({
        event_id: id,
        user_id: user.id,
        rating: validated.rating,
        comment: validated.comment,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("You've already reviewed this event");
        } else {
          throw error;
        }
      } else {
        toast.success("Review submitted successfully!");
        setComment("");
        setRating(5);
        fetchEvent();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to submit review");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isOrganizer = user?.id === event.organizer_id;
  const hasEnded = new Date(event.end_time) < new Date();
  const avgRating = event.reviews.length > 0
    ? (event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Event Header */}
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    {!event.is_public && <Badge variant="secondary">Private</Badge>}
                  </div>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
                {isOrganizer && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      <Link to={`/events/${id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start</p>
                    <p className="font-medium">{format(new Date(event.start_time), "PPp")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">End</p>
                    <p className="font-medium">{format(new Date(event.end_time), "PPp")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                    <p className="font-medium">{event.organizer.full_name}</p>
                  </div>
                </div>
              </div>

              {/* RSVP Buttons */}
              {!isOrganizer && !hasEnded && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRsvp("going")}
                    variant={userRsvp === "going" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Going ({event.rsvps.filter((r) => r.status === "going").length})
                  </Button>
                  <Button
                    onClick={() => handleRsvp("maybe")}
                    variant={userRsvp === "maybe" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Maybe ({event.rsvps.filter((r) => r.status === "maybe").length})
                  </Button>
                  <Button
                    onClick={() => handleRsvp("not_going")}
                    variant={userRsvp === "not_going" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Can't Go
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-accent text-accent" />
                Reviews ({event.reviews.length}) - {avgRating} average
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Submit Review Form */}
              {user && hasEnded && !event.reviews.some((r) => r.user_id === user.id) && (
                <form onSubmit={handleSubmitReview} className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Your Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submittingReview}>
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {event.reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to review this event!
                  </p>
                ) : (
                  event.reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.user.full_name}</span>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), "PP")}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
