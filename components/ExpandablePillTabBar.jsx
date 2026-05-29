import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Ícones SVG customizados (Tabler icons inspired)
const icons = {
  home: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10.22 3.22a2 2 0 012.56 0l7 7A2 2 0 0020 12.22V19a2 2 0 01-2 2h-3v-5h-4v5H6a2 2 0 01-2-2v-6.78a2 2 0 01.22-1.22l7-7z" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM16 20a3 3 0 00-3-3H5a3 3 0 00-3 3v2h14v-2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 5a1 1 0 011-1h4a1 1 0 011 1v1h4a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h4V5z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12a3 3 0 100-6 3 3 0 000 6zm0 2c-5.33 0-8 2.67-8 8v2h16v-2c0-5.33-2.67-8-8-8z" />
    </svg>
  ),
};

const tabs = [
  { id: "home", label: "Início", icon: icons.home },
  { id: "search", label: "Buscar", icon: icons.search },
  { id: "community", label: "Comunidade", icon: icons.users },
  { id: "events", label: "Eventos", icon: icons.calendar },
  { id: "profile", label: "Perfil", icon: icons.user },
];

export default function ExpandablePillTabBar() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Preview Container */}
      <div className="w-full max-w-2xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Expandable Pill Tab Bar
          </h1>
          <p className="text-slate-600">
            Barra de navegação premium com animações fluidas e interação intuitiva
          </p>
        </div>

        {/* Tab Bar Container */}
        <div className="relative">
          {/* Background Blur Pill */}
          <motion.div
            layoutId="pill-background"
            className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />

          {/* Active Tab Highlight Background */}
          <motion.div
            layoutId="active-bg"
            className="absolute top-2 left-2 right-2 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-2xl opacity-0"
            initial={false}
            animate={{
              opacity: activeTab ? 0.12 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Tabs Container */}
          <div className="relative flex justify-between items-center px-2 py-2 gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center flex-1 px-3 py-3 rounded-2xl transition-colors duration-200 cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active Tab Animated Background */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-active"
                      className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Animated Pill Border */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 border-2 border-indigo-200 rounded-2xl pointer-events-none"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Top Indicator Dot */}
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    />
                  )}

                  {/* Icon Container */}
                  <motion.div
                    className="relative z-10 mb-1"
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      color: isActive
                        ? "#6366f1"
                        : "#94a3b8",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 25,
                    }}
                  >
                    {tab.icon}
                  </motion.div>

                  {/* Label - Expands when active */}
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.span
                        key={`label-${tab.id}`}
                        className="relative z-10 text-xs font-semibold text-indigo-600 whitespace-nowrap"
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{
                          duration: 0.2,
                          ease: "easeOut",
                        }}
                      >
                        {tab.label}
                      </motion.span>
                    ) : (
                      <motion.span
                        key={`label-hidden-${tab.id}`}
                        className="relative z-10 text-[10px] font-medium text-slate-500 h-3"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Hover Glow Effect */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 bg-slate-400/0 rounded-2xl group-hover:bg-slate-400/5 transition-colors"
                      initial={false}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-8 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <p className="text-slate-600">
            Conteúdo da aba "{tabs.find((t) => t.id === activeTab)?.label}" é
            exibido aqui com animação suave.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-sm font-medium text-indigo-700"
              >
                Item {i}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Fluido", desc: "Animações spring suaves" },
            { title: "Premium", desc: "Design minimalista refinado" },
            { title: "Responsivo", desc: "Adapta-se a qualquer tamanho" },
          ].map((item) => (
            <div
              key={item.title}
              className="p-4 bg-white rounded-lg border border-slate-200"
            >
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
