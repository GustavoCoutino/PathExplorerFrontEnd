import { useState, useEffect } from "react";
import {
  Skill,
  ProjectRole,
  ProjectFormData,
  RoleSkill,
} from "@/types/projectsAdministration";
import axios from "axios";
import { format } from "date-fns";
import AddRoleDialog from "./AddRoleDialog";
import NewProjectDialog from "./NewProjectDialog";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/constants";

function NewProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    id_proyecto: 0,
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin_estimada: "",
    prioridad: 3,
    roles: [],
    startDate: "",
    endDate: "",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    name: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        fecha_inicio: format(date, "yyyy-MM-dd"),
      }));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        fecha_fin_estimada: format(date, "yyyy-MM-dd"),
      }));
    }
  };

  const addRole = () => {
    setFormData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          titulo: "",
          descripcion: "",
          importancia: 3,
          nivel_experiencia_requerido: 3,
          habilidades: [],
        },
      ],
    }));
  };

  const updateRole = (
    index: number,
    field: keyof ProjectRole,
    value: string | number
  ) => {
    const updatedRoles = [...formData.roles];
    updatedRoles[index] = {
      ...updatedRoles[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  const removeRole = (index: number) => {
    const updatedRoles = [...formData.roles];
    updatedRoles.splice(index, 1);
    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true);
        const token = localStorage.getItem("token");

        const response = await axios.get(`${apiUrl}/projects/all-skills`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setSkills(response.data.skills);
        }
      } catch (err) {
        console.error("Error fetching skills:", err);
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchSkills();
  }, []);

  const addSkillToRole = (
    roleIndex: number,
    skillData?: {
      id_habilidad: number;
      nombre: string;
      nivel_minimo_requerido: number;
      importancia: number;
    }
  ) => {
    const updatedRoles = [...formData.roles];

    if (skillData) {
      const exists = updatedRoles[roleIndex].habilidades.some(
        (h) => h.id_habilidad === skillData.id_habilidad
      );
      if (exists) return;

      updatedRoles[roleIndex].habilidades.push(skillData);
    } else {
      if (skills.length > 0) {
        const firstSkill = skills[0];
        const exists = updatedRoles[roleIndex].habilidades.some(
          (h) => h.id_habilidad === firstSkill.id_habilidad
        );
        if (exists) return;

        updatedRoles[roleIndex].habilidades.push({
          id_habilidad: firstSkill.id_habilidad,
          nombre: firstSkill.nombre,
          nivel_minimo_requerido: 3,
          importancia: 3,
        });
      }
    }

    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  const updateSkill = (
    roleIndex: number,
    skillIndex: number,
    field: keyof RoleSkill,
    value: number
  ) => {
    const updatedRoles = [...formData.roles];
    updatedRoles[roleIndex].habilidades[skillIndex] = {
      ...updatedRoles[roleIndex].habilidades[skillIndex],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  const removeSkillFromRole = (roleIndex: number, skillIndex: number) => {
    const updatedRoles = [...formData.roles];
    updatedRoles[roleIndex].habilidades.splice(skillIndex, 1);
    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.roles.length === 0) {
      setFormError("Debes añadir al menos un rol antes de crear el proyecto.");
      return;
    }
    const start = new Date(formData.fecha_inicio);
    const end = new Date(formData.fecha_fin_estimada);
    if (end < start) {
      setFormError(
        "La fecha estimada de finalización debe ser igual o posterior a la fecha de inicio."
      );
      return;
    }
    setFormLoading(true);

    try {
      const token = localStorage.getItem("token");
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");

      const projectData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin_estimada: formData.fecha_fin_estimada,
        prioridad: formData.prioridad,
        id_manager: userInfo.id_persona,
        roles: formData.roles.map((role) => ({
          titulo: role.titulo,
          descripcion: role.descripcion,
          importancia: 3,
          nivel_experiencia_requerido: role.nivel_experiencia_requerido,
          habilidades: role.habilidades.map((skill) => ({
            id_habilidad: skill.id_habilidad,
            nivel_minimo_requerido: skill.nivel_minimo_requerido,
            importancia: skill.importancia,
          })),
        })),
      };

      const response = await axios.post(
        `${apiUrl}/projects/create-project`,
        projectData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        onSuccess();

        const fetchProjects = async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
              `${apiUrl}/projects/manager-projects-with-roles`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          } catch (err) {
            console.error("Error refreshing projects:", err);
          }
        };

        fetchProjects();
      } else {
        setFormError(response.data.message || "Error al crear el proyecto");
      }
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
          {formError}
        </div>
      )}

      <NewProjectDialog
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        startDate={startDate}
        endDate={endDate}
      />

      <AddRoleDialog
        addRole={addRole}
        removeRole={removeRole}
        updateRole={updateRole}
        updateSkill={updateSkill}
        addSkillToRole={addSkillToRole}
        removeSkillFromRole={removeSkillFromRole}
        skills={skills}
        formData={formData}
        loadingSkills={loadingSkills}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="submit"
          disabled={
            formLoading ||
            formData.roles.length === 0 ||
            (startDate !== undefined &&
              endDate !== undefined &&
              endDate < startDate)
          }
          title={
            formLoading
              ? ""
              : formData.roles.length === 0
              ? "Añade al menos un rol para habilitar"
              : startDate !== undefined &&
                endDate !== undefined &&
                endDate < startDate
              ? "La fecha de fin no puede ser anterior a la fecha de inicio"
              : ""
          }
        >
          {formLoading ? "Creando..." : "Crear Proyecto"}
        </Button>
      </div>
    </form>
  );
}

export default NewProjectForm;
