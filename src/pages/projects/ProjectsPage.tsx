import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { projectService, type Project } from '@/services/project.service';
import { Plus, Edit, Eye, Loader2, MapPin, Calendar, DollarSign, AlertTriangle, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  code: z.string().min(1, 'Project code is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.number().min(0, 'Budget must be positive'),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const progressSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  plannedProgress: z.number().min(0).max(100),
  actualProgress: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type ProgressFormData = z.infer<typeof progressSchema>;

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-500',
  IN_PROGRESS: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
};

const statusOptions = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [progressProject, setProgressProject] = useState<Project | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      location: '',
      budget: 0,
      status: 'PLANNING',
    },
  });

  const progressForm = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      plannedProgress: 0,
      actualProgress: 0,
      notes: '',
    },
  });

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      form.reset({
        name: project.name,
        code: project.code || '',
        description: project.description || '',
        location: project.location || '',
        startDate: project.startDate.split('T')[0],
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: Number(project.budget),
        status: project.status as ProjectFormData['status'],
      });
    } else {
      setEditingProject(null);
      form.reset({
        name: '',
        code: '',
        description: '',
        location: '',
        budget: 0,
        status: 'PLANNING',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, data);
        toast.success('Project updated successfully');
      } else {
        await projectService.createProject(data);
        toast.success('Project created successfully');
      }
      setIsDialogOpen(false);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const handleOpenProgressDialog = (project: Project) => {
    setProgressProject(project);
    const currentProgress = project.progress?.length ? Number(project.progress[0].actualProgress) : 0;
    const currentPlanned = project.progress?.length ? Number(project.progress[0].plannedProgress) : 0;
    progressForm.reset({
      date: new Date().toISOString().split('T')[0],
      plannedProgress: currentPlanned,
      actualProgress: currentProgress,
      notes: '',
    });
    setIsProgressOpen(true);
  };

  const onProgressSubmit = async (data: ProgressFormData) => {
    if (!progressProject) return;
    
    setIsUpdatingProgress(true);
    try {
      await projectService.addProgress(progressProject.id, data);
      toast.success('Progress updated successfully');
      setIsProgressOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleViewProject = async (project: Project) => {
    try {
      const detail = await projectService.getProjectById(project.id);
      setSelectedProject(detail);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Failed to load project details');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage construction projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown Tower" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PRJ-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Project description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New York, NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingProject ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{project.code}</p>
                </div>
                <Badge className={`${statusColors[project.status]} text-white`}>
                  {statusOptions.find((s) => s.value === project.status)?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {project.location}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(project.startDate), 'MMM dd, yyyy')} - {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'TBD'}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Budget: ${Number(project.budget).toLocaleString()}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress?.length ? Math.round(Number(project.progress[0].actualProgress)) : 0}%</span>
                </div>
                <Progress value={project.progress?.length ? Math.round(Number(project.progress[0].actualProgress)) : 0} />
              </div>

              <div className="flex justify-end gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => handleOpenProgressDialog(project)}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Update Progress
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleViewProject(project)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(project)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No projects found. Create your first project.
          </div>
        )}
      </div>

      {/* Project Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project Name</p>
                  <p className="font-medium">{selectedProject.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project Code</p>
                  <p className="font-medium">{selectedProject.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[selectedProject.status]} text-white`}>
                    {statusOptions.find((s) => s.value === selectedProject.status)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedProject.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {format(new Date(selectedProject.startDate), 'MMM dd, yyyy')} - {selectedProject.endDate ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy') : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">${Number(selectedProject.budget).toLocaleString()}</p>
                </div>
              </div>

              {selectedProject.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedProject.description}</p>
                </div>
              )}

              {/* Progress History */}
              {selectedProject.progress && selectedProject.progress.length > 0 && (
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-blue-500" />
                    Progress History
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Planned</TableHead>
                        <TableHead>Actual</TableHead>
                        <TableHead>Deviation</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.progress.map((prog) => (
                        <TableRow key={prog.id}>
                          <TableCell>{format(new Date(prog.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{Number(prog.plannedProgress)}%</TableCell>
                          <TableCell>{Number(prog.actualProgress)}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                Number(prog.actualProgress) >= Number(prog.plannedProgress)
                                  ? 'default'
                                  : Number(prog.actualProgress) >= Number(prog.plannedProgress) - 10
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {Number(prog.actualProgress) - Number(prog.plannedProgress)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">
                            {prog.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Risk Logs */}
              {selectedProject.riskLogs && selectedProject.riskLogs.length > 0 && (
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Risk Logs
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Factors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.riskLogs.map((risk) => (
                        <TableRow key={risk.id}>
                          <TableCell>{format(new Date(risk.calculatedAt), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{risk.riskScore}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'HIGH'
                                  ? 'destructive'
                                  : risk.riskLevel === 'MEDIUM'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {risk.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            Budget: {risk.factors.budgetOverrun}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress - {progressProject?.name}</DialogTitle>
          </DialogHeader>
          <Form {...progressForm}>
            <form onSubmit={progressForm.handleSubmit(onProgressSubmit)} className="space-y-4">
              <FormField
                control={progressForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={progressForm.control}
                  name="plannedProgress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Progress (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={progressForm.control}
                  name="actualProgress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Progress (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={progressForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Progress notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsProgressOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingProgress}>
                  {isUpdatingProgress && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Progress
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
