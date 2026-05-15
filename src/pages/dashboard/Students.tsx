import StudentsList from "@/components/students/StudentList";

const StudentsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">
            Students
          </h2>
        </div>
      </div>

      <StudentsList hideHeader={true} />
    </div>
  );
};

export default StudentsPage;