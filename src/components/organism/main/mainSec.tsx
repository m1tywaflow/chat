import Header from "../header/header";
import SideBar from "../side-bar/SideBar";
export default function MainSection() {
  return (
    <>
      <section className="bg-white w-7xl mx-auto h-screen border-2">
        <div className="text-black">
          <Header />
          <SideBar />
        </div>
      </section>
    </>
  );
}
