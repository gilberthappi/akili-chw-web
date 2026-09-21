import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, User, Phone, Calendar, MapPin,
  Users as UsersIcon, CreditCard, Building2, GraduationCap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField, AuthSelect, AuthSectionHeading } from "@/components/auth/AuthFields";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { signup } from "@/services/auth.service";
import { ISignUp } from "@/types/auth";
import { signupSchema } from "@/schemas/users.schema";
import { locations } from "@/hooks/locations";
import { getPublicHospitals } from "@/services/healthCenters.service";

export const Signup: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSector, setSelectedSector]     = useState("");
  const [selectedCell, setSelectedCell]         = useState("");

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ISignUp>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "", fullNames: "", phoneNumber: "",
      district: "", sector: "", cell: "", village: "",
      NID: "", birthdate: "", gender: "", healthCenterId: "",
    },
  });

  const { data: healthCenters = [] } = useQuery({
    queryKey: ["publicHospitals"],
    queryFn: () => getPublicHospitals({ limit: 200 }),
  });

  const hospitalOptions = healthCenters.map((h) => ({ value: h.id, label: h.name }));

  const districts = useMemo(() =>
    locations.provinces.flatMap((p) =>
      p.districts.map((d) => ({ value: d.name, label: d.name }))
    ), []);

  const sectors = useMemo(() => {
    if (!selectedDistrict) return [];
    const d = locations.provinces.flatMap((p) => p.districts).find((d) => d.name === selectedDistrict);
    return d ? d.sectors.map((s) => ({ value: s.name, label: s.name })) : [];
  }, [selectedDistrict]);

  const cells = useMemo(() => {
    if (!selectedDistrict || !selectedSector) return [];
    const d = locations.provinces.flatMap((p) => p.districts).find((d) => d.name === selectedDistrict);
    const s = d?.sectors.find((s) => s.name === selectedSector);
    return s ? s.cells.map((c) => ({ value: c.name, label: c.name })) : [];
  }, [selectedDistrict, selectedSector]);

  const villages = useMemo(() => {
    if (!selectedDistrict || !selectedSector || !selectedCell) return [];
    const d = locations.provinces.flatMap((p) => p.districts).find((d) => d.name === selectedDistrict);
    const s = d?.sectors.find((s) => s.name === selectedSector);
    const c = s?.cells.find((c) => c.name === selectedCell);
    return c ? c.villages.map((v) => ({ value: v.name, label: v.name })) : [];
  }, [selectedDistrict, selectedSector, selectedCell]);

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value); setSelectedSector(""); setSelectedCell("");
    setValue("district", value); setValue("sector", ""); setValue("cell", ""); setValue("village", "");
  };
  const handleSectorChange = (value: string) => {
    setSelectedSector(value); setSelectedCell("");
    setValue("sector", value); setValue("cell", ""); setValue("village", "");
  };
  const handleCellChange = (value: string) => {
    setSelectedCell(value);
    setValue("cell", value); setValue("village", "");
  };

  const onSubmit = async (data: ISignUp) => {
    try {
      await signup(data);
      toast.success("Registration successful! Please login.");
      navigate("/auth/login");
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed";
      toast.error(msg);
    }
  };

  const genderOptions = [{ value: "Female", label: "Female" }, { value: "Male", label: "Male" }, { value: "Other", label: "Other" }];
  const educationOptions = [
    { value: "HIGH_SCHOOL", label: t("education.HIGH_SCHOOL") },
    { value: "ASSOCIATE_DEGREE_A1", label: t("education.ASSOCIATE_DEGREE_A1") },
    { value: "BACHELORS_DEGREE_A0", label: t("education.BACHELORS_DEGREE_A0") },
    { value: "MASTERS_DEGREE", label: t("education.MASTERS_DEGREE") },
    { value: "PHD", label: t("education.PHD") },
    { value: "PROFESSOR", label: t("education.PROFESSOR") },
  ];

  return (
    <AuthLayout maxWidthClass="max-w-[560px]" centered={false}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
          Create Account
        </h1>
        <p className="text-base text-gray-500">
          Join the eBumenyi learning platform
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <div className="space-y-4">
          <AuthSectionHeading>Personal Information</AuthSectionHeading>
          <div className="grid grid-cols-2 gap-4">
            <AuthField size="sm" label="Full Names" placeholder="John Doe" icon={<User size={16} />} error={errors.fullNames?.message} reg={register("fullNames")} />
            <AuthSelect label="Gender" icon={<UsersIcon size={16} />} error={errors.gender?.message} reg={register("gender")} options={genderOptions} defaultLabel="Select Gender" />
            <AuthField size="sm" label="Phone Number" placeholder="+250 7XX XXX XXX" type="tel" icon={<Phone size={16} />} error={errors.phoneNumber?.message} reg={register("phoneNumber")} />
            <AuthField size="sm" label="Email Address" placeholder="john.doe@example.com" type="email" icon={<Mail size={16} />} error={errors.email?.message} reg={register("email")} />
            <AuthField size="sm" label="National ID (NID)" placeholder="1XXXXXXXXXXXXXXXX" icon={<CreditCard size={16} />} error={errors.NID?.message} reg={register("NID")} />
            <AuthField size="sm" label="Date of Birth" type="date" icon={<Calendar size={16} />} error={errors.birthdate?.message} reg={register("birthdate")} />
            <div className="col-span-2">
              <AuthSelect label="Level of Education" icon={<GraduationCap size={16} />} error={errors.educationLevel?.message} reg={register("educationLevel")} options={educationOptions} defaultLabel="Select Level of Education" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AuthSectionHeading>Location</AuthSectionHeading>
          <div className="grid grid-cols-2 gap-4">
            <AuthSelect label="District" icon={<MapPin size={16} />} error={errors.district?.message} reg={register("district")} options={districts} defaultLabel="Select District" onChange={handleDistrictChange} />
            <AuthSelect label="Sector" icon={<MapPin size={16} />} error={errors.sector?.message} reg={register("sector")} options={sectors} defaultLabel={selectedDistrict ? "Select Sector" : "Select District first"} onChange={handleSectorChange} disabled={!selectedDistrict} />
            <AuthSelect label="Cell" icon={<MapPin size={16} />} error={errors.cell?.message} reg={register("cell")} options={cells} defaultLabel={selectedSector ? "Select Cell" : "Select Sector first"} onChange={handleCellChange} disabled={!selectedSector} />
            <AuthSelect label="Village" icon={<MapPin size={16} />} error={errors.village?.message} reg={register("village")} options={villages} defaultLabel={selectedCell ? "Select Village" : "Select Cell first"} disabled={!selectedCell} />
          </div>
        </div>

        <div className="space-y-4">
          <AuthSectionHeading>Health Facility</AuthSectionHeading>
          <AuthSelect
            label="HealthCenter / Health Center"
            icon={<Building2 size={16} />}
            error={errors.healthCenterId?.message}
            reg={register("healthCenterId")}
            options={hospitalOptions}
            defaultLabel="Select HealthCenter (optional)"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="w-4 h-4 rounded border-gray-300 bg-white accent-[#3363AD] dark:border-white/20 dark:bg-[#1a2235]"
          />
          <span className="text-sm text-gray-500">
            I agree to the{" "}
            <Link to="/terms" className="text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] transition-colors">
              Terms and Conditions
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#3363AD] hover:bg-[#2a52a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 text-base rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="pt-2 border-t border-gray-100 dark:border-white/[0.05] text-center">
          <p className="text-sm text-gray-500 dark:text-gray-600">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-[#3363AD] hover:text-[#2a52a0] dark:text-[#4a90d9] dark:hover:text-[#6aaae8] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
