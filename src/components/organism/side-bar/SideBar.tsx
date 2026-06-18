import UserCard from "@/components/molecules/user-card/UserCard";

export default function SideBar() {
  return (
    <>
      <section className="left h-screen bg-[#74658A] border w-76">
        <div>
          <UserCard />
        </div>
      </section>
    </>
  );
}
