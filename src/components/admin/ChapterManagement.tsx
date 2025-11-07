import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  Loader2,
} from "lucide-react";
import {
  adminService,
  type ChapterWithStats,
  type UserWithChapter,
} from "@/lib/services/adminService";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

const chapterFormSchema = z.object({
  name: z.string().min(2, "Chapter name must be at least 2 characters"),
  leader_id: z.string().optional(),
});

type ChapterFormData = z.infer<typeof chapterFormSchema>;

const ChapterManagement: React.FC = () => {
  const [chapters, setChapters] = useState<ChapterWithStats[]>([]);
  const [availableLeaders, setAvailableLeaders] = useState<UserWithChapter[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterWithStats | null>(
    null
  );

  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      name: "",
      leader_id: "",
    },
  });

  useEffect(() => {
    loadChapters();
    loadAvailableLeaders();
  }, []);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const chaptersData = await adminService.getTopChapters(50); // Get all chapters
      setChapters(chaptersData);
    } catch (error) {
      console.error("Error loading chapters:", error);
      toast.error("Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableLeaders = async () => {
    try {
      // Get users who can be chapter leaders (chapter_leader or administrator roles)
      const { users } = await adminService.getUsers(1, 100, {
        role: "chapter_leader",
      });
      setAvailableLeaders(users);
    } catch (error) {
      console.error("Error loading available leaders:", error);
    }
  };

  const handleCreateChapter = async (data: ChapterFormData) => {
    try {
      setLoadingChapters(true);

      const { error } = await supabase.from("chapters").insert({
        name: data.name,
        leader_id:
          data.leader_id && data.leader_id !== "none" ? data.leader_id : null,
      });

      if (error) throw error;

      await adminService.logAdminAction("chapter_created", {
        chapter_name: data.name,
        leader_id: data.leader_id,
      });

      toast.success("Chapter created successfully");
      setIsCreateDialogOpen(false);
      form.reset();
      loadChapters();
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      toast.error(error.message || "Failed to create chapter");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleUpdateChapter = async (data: ChapterFormData) => {
    if (!editingChapter) return;

    try {
      const { error } = await supabase
        .from("chapters")
        .update({
          name: data.name,
          leader_id:
            data.leader_id && data.leader_id !== "none" ? data.leader_id : null,
        })
        .eq("id", editingChapter.id);

      if (error) throw error;

      await adminService.logAdminAction("chapter_updated", {
        chapter_id: editingChapter.id,
        updated_data: data,
      });

      toast.success("Chapter updated successfully");
      setEditingChapter(null);
      form.reset();
      loadChapters();
    } catch (error: any) {
      console.error("Error updating chapter:", error);
      toast.error(error.message || "Failed to update chapter");
    }
  };

  const handleDeleteChapter = async (chapter: ChapterWithStats) => {
    if (chapter.member_count > 0) {
      toast.error(
        "Cannot delete chapter with active members. Please reassign members first."
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${chapter.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("chapters")
        .delete()
        .eq("id", chapter.id);

      if (error) throw error;

      await adminService.logAdminAction("chapter_deleted", {
        chapter_id: chapter.id,
        chapter_name: chapter.name,
      });

      toast.success("Chapter deleted successfully");
      loadChapters();
    } catch (error: any) {
      console.error("Error deleting chapter:", error);
      toast.error(error.message || "Failed to delete chapter");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredChapters = chapters.filter((chapter) =>
    chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Chapter Management
          </h3>
          <p className="text-muted-foreground">
            Manage all chapters in the system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chapter</DialogTitle>
              <DialogDescription>
                Add a new chapter to the system and optionally assign a leader.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreateChapter)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nairobi Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leader_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter Leader</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a leader (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Leader</SelectItem>
                          {availableLeaders.map((leader) => (
                            <SelectItem key={leader.id} value={leader.id}>
                              {leader.full_name || leader.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button type="submit" disabled={loadingChapters}>
                    {loadingChapters && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Chapter
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chapters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chapters Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Chapters
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chapters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chapters.reduce((sum, chapter) => sum + chapter.member_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                chapters.reduce(
                  (sum, chapter) => sum + chapter.total_revenue,
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chapters ({filteredChapters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredChapters.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{chapter.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {chapter.leader ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3 w-3 text-success" />
                          <span className="text-sm">
                            {chapter.leader.full_name || chapter.leader.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No leader assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {chapter.member_count} members
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-success" />
                        {formatCurrency(chapter.total_revenue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {chapter.metrics_count} submitted
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(chapter.created_at).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingChapter(chapter);
                            form.reset({
                              name: chapter.name,
                              leader_id: chapter.leader_id || "none",
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChapter(chapter)}
                          disabled={chapter.member_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Chapter Dialog */}
      <Dialog
        open={!!editingChapter}
        onOpenChange={(open) => !open && setEditingChapter(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>
              Update chapter information and leader assignment.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdateChapter)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nairobi Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leader_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Leader</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a leader (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Leader</SelectItem>
                        {availableLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.full_name || leader.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingChapter(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Chapter</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterManagement;
