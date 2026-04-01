import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Calendar, MapPin, Building2, Briefcase, Users as UsersIcon } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { AuthDecorativePanel } from "@/components/auth/AuthDecorativePanel";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import TextField from "@/components/common/form/TextField";
import PasswordField from "@/components/common/form/PasswordField";
import OptionsField from "@/components/common/form/OptionsField";
import Button from "@/components/common/form/Button";
import { signup } from "@/services/auth.service";
import { ISignUp } from "@/types/auth";
import { signupSchema } from "@/schemas/users.schema";
import { locations } from "@/hooks/locations";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedCell, setSelectedCell] = useState<string>("");

  const methods = useForm<ISignUp>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      fullNames: "",
      phoneNumber: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
      NID: "",
      birthdate: "",
      gender: "",
      role: "",
      industry: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    setValue,
  } = methods;

  // Get districts from locations data
  const districts = useMemo(() => {
    return locations.provinces.flatMap((province) =>
      province.districts.map((district) => ({
        value: district.name,
        label: district.name,
      }))
    );
  }, []);

  // Get sectors for selected district
  const sectors = useMemo(() => {
    if (!selectedDistrict) return [];
    const district = locations.provinces
      .flatMap((p) => p.districts)
      .find((d) => d.name === selectedDistrict);
    if (!district) return [];
    return district.sectors.map((sector) => ({
      value: sector.name,
      label: sector.name,
    }));
  }, [selectedDistrict]);

  // Get cells for selected sector
  const cells = useMemo(() => {
    if (!selectedDistrict || !selectedSector) return [];
    const district = locations.provinces
      .flatMap((p) => p.districts)
      .find((d) => d.name === selectedDistrict);
    if (!district) return [];
    const sector = district.sectors.find((s) => s.name === selectedSector);
    if (!sector) return [];
    return sector.cells.map((cell) => ({
      value: cell.name,
      label: cell.name,
    }));
  }, [selectedDistrict, selectedSector]);

  // Get villages for selected cell
  const villages = useMemo(() => {
    if (!selectedDistrict || !selectedSector || !selectedCell) return [];
    const district = locations.provinces
      .flatMap((p) => p.districts)
      .find((d) => d.name === selectedDistrict);
    if (!district) return [];
    const sector = district.sectors.find((s) => s.name === selectedSector);
    if (!sector) return [];
    const cell = sector.cells.find((c) => c.name === selectedCell);
    if (!cell) return [];
    return cell.villages.map((village) => ({
      value: village.name,
      label: village.name,
    }));
  }, [selectedDistrict, selectedSector, selectedCell]);

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedSector("");
    setSelectedCell("");
    setValue("district", value);
    setValue("sector", "");
    setValue("cell", "");
    setValue("village", "");
  };

  const handleSectorChange = (value: string) => {
    setSelectedSector(value);
    setSelectedCell("");
    setValue("sector", value);
    setValue("cell", "");
    setValue("village", "");
  };

  const handleCellChange = (value: string) => {
    setSelectedCell(value);
    setValue("cell", value);
    setValue("village", "");
  };

  const onSubmit = async (data: ISignUp) => {
    try {
      await signup(data);
      toast.success("Registration successful! Please login.");
      navigate("/auth/login");
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed";
      toast.error(msg);
    }
  };

  const genderOptions = ["Female", "Male", "Other"];
  const roleOptions = ["TRAINEE", "TRAINER", "ADMIN"];
  const industryOptions = ["WELTEL", "RBC", "SFH", "CIIC-HIN"];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#3363AD]/10 via-white to-[#3363AD]/5">
      <AuthDecorativePanel />

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full py-6">
          {/* Logo & Title (Mobile only) */}
          <div className="text-center mb-6 lg:hidden">
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white">
                <img
                  src="/chw.png"
                  alt="eBumenyi"
                  className="w-40 h-40 object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-sm text-gray-600">Welcome to eBumenyi</p>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-sm text-gray-600">Join the eBumenyi learning platform</p>
          </div>

          {/* Signup Form */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Full Names"
                    type="text"
                    placeholder="John Doe"
                    icon={<User size={20} />}
                    register={register("fullNames")}
                    error={errors.fullNames?.message}
                  />

                  <OptionsField
                    label="Gender"
                    register={register("gender")}
                    required={true}
                    defaultLabel="Select Gender"
                    icon={<UsersIcon size={20} />}
                    error={errors.gender?.message}
                    options={genderOptions.map((gender) => ({
                      value: gender,
                      label: gender,
                    }))}
                  />

                  <TextField
                    label="Phone Number"
                    type="tel"
                    placeholder="+250 XXX XXX XXX"
                    icon={<Phone size={20} />}
                    register={register("phoneNumber")}
                    error={errors.phoneNumber?.message}
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    placeholder="john.doe@example.com"
                    icon={<Mail size={20} />}
                    register={register("email")}
                    error={errors.email?.message}
                  />

                  <TextField
                    label="National ID (NID)"
                    type="text"
                    placeholder="1XXXXXXXXXXXXXXXX"
                    icon={<User size={20} />}
                    register={register("NID")}
                    error={errors.NID?.message}
                  />

                  <TextField
                    label="Date of Birth"
                    type="date"
                    icon={<Calendar size={20} />}
                    register={register("birthdate")}
                    error={errors.birthdate?.message}
                  />
                </div>
              </div>

              {/* Role & Industry */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                   Organization  & Role
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <OptionsField
                    label="Industry/Organization"
                    register={register("industry")}
                    required={true}
                    defaultLabel="Select Industry"
                    icon={<Building2 size={20} />}
                    error={errors.industry?.message}
                    options={industryOptions.map((industry) => ({
                      value: industry,
                      label: industry === "SFH" ? "SFH Rwanda" : industry === "CIIC-HIN" ? "CIIC-HIN Rwanda": industry === "WELTEL" ? "WELTEL Rwanda" : "RBC",
                    }))}
                  />

                   <OptionsField
                    label="Role"
                    register={register("role")}
                    required={true}
                    defaultLabel="Select Role"
                    icon={<Briefcase size={20} />}
                    error={errors.role?.message}
                    options={roleOptions.map((role) => ({
                      value: role,
                      label: role === "TRAINEE" ? "Trainee (CHW)" : role === "TRAINER" ? "Trainer (Supervisor)" : "Admin",
                    }))}
                  />

                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <OptionsField
                    label="District"
                    register={register("district")}
                    required={false}
                    defaultLabel="Select District"
                    icon={<MapPin size={20} />}
                    error={errors.district?.message}
                    options={districts}
                    onChange={handleDistrictChange}
                  />

                  <OptionsField
                    label="Sector"
                    register={register("sector")}
                    required={false}
                    defaultLabel={selectedDistrict ? "Select Sector" : "Select District first"}
                    icon={<MapPin size={20} />}
                    error={errors.sector?.message}
                    options={sectors}
                    onChange={handleSectorChange}
                    disabled={!selectedDistrict}
                  />

                  <OptionsField
                    label="Cell"
                    register={register("cell")}
                    required={false}
                    defaultLabel={selectedSector ? "Select Cell" : "Select Sector first"}
                    icon={<MapPin size={20} />}
                    error={errors.cell?.message}
                    options={cells}
                    onChange={handleCellChange}
                    disabled={!selectedSector}
                  />

                  <OptionsField
                    label="Village"
                    register={register("village")}
                    required={false}
                    defaultLabel={selectedCell ? "Select Village" : "Select Cell first"}
                    icon={<MapPin size={20} />}
                    error={errors.village?.message}
                    options={villages}
                    disabled={!selectedCell}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PasswordField
                    label="Password"
                    placeholder="••••••••"
                    icon={<Lock size={20} />}
                    error={errors.password?.message}
                    {...register("password")}
                  />

                  <PasswordField
                    label="Confirm Password"
                    placeholder="••••••••"
                    icon={<Lock size={20} />}
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#3363AD] border-gray-300 rounded focus:ring-[#3363AD]"
                  required
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <Link to="/terms" className="text-[#3363AD] hover:underline">
                    Terms and Conditions
                  </Link>
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  label="Create Account"
                  isLoading={isSubmitting}
                  className="bg-primary text-white w-full py-3 rounded-lg"
                />
              </div>
            </form>
          </FormProvider>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="text-[#3363AD] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} eBumenyi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
