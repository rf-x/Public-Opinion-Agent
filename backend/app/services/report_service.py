from typing import List, Tuple, Optional, Dict

from app.core.config import get_settings
from app.clients.exa_client import ExaClient
from app.providers.llm_factory import get_llm_provider


class ReportService:
    """Compose web-grounded research with LLM synthesis into a Markdown report."""

    def __init__(self, model: Optional[str] = None, provider: Optional[str] = None):
        settings = get_settings()
        self.llm = get_llm_provider(model_override=model, provider_override=provider)
        self.exa = ExaClient()
        self.default_model = model or settings.LLM_MODEL

    async def generate_report(self, topic: str, outline: List[str], refinements: List[str]) -> Tuple[str, List[str]]:
        # Organize requirements by section
        section_to_requirements = self._group_requirements_by_section(outline=outline, refinements=refinements)

        all_sources: List[str] = []
        sections_markdown: List[str] = []

        # 添加报告标题
        title_md = f"# {topic}\n\n"
        sections_markdown.append(title_md)

        for section in outline:
            requirements = section_to_requirements.get(section, [])
            # For each requirement within this section, rewrite the query and call Exa
            research_snippets: List[str] = []
            section_sources: List[str] = []

            # If no requirements, still perform one research query focused on the section
            effective_requirements = requirements if requirements else ["无具体要求"]

            for req in effective_requirements:
                query = await self._rewrite_query(topic=topic, section=section, requirement=req)
                answer, citations = await self.exa.answer_question(query=query)
                if answer:
                    research_snippets.append(answer)
                if citations:
                    for url in citations:
                        if url not in section_sources:
                            section_sources.append(url)

            # Synthesize this section using gathered research and requirements
            section_md = await self._synthesize_section(
                topic=topic,
                section=section,
                requirements=requirements,
                research_snippets=research_snippets,
            )
            if section_md:
                # Ensure each section has a clear heading
                if not section_md.strip().startswith("##"):
                    section_md = f"## {section}\n\n" + section_md.strip()
                sections_markdown.append(section_md.strip())

            # Merge unique sources
            for url in section_sources:
                if url not in all_sources:
                    all_sources.append(url)

        draft_report = ("\n\n".join(sections_markdown)).strip()

        # Final harmonization to ensure consistent style/format across sections
        final_body = await self._harmonize_report(
            topic=topic,
            outline=outline,
            draft=draft_report,
        )

        final_markdown = final_body.strip()
        if all_sources:
            final_markdown += "\n\n## 参考资料\n" + "\n".join([f"- {src}" for src in all_sources])
        return final_markdown, all_sources

    def _group_requirements_by_section(self, outline: List[str], refinements: List[str]) -> Dict[str, List[str]]:
        mapping: Dict[str, List[str]] = {sec: [] for sec in outline}
        if not refinements:
            return mapping
        for r in refinements:
            text = r.strip()
            matched = False
            # Expect format like: 【事件起因】要求文本
            if text.startswith("【") and "】" in text:
                sec = text[1:text.index("】")]
                content = text[text.index("】") + 1 :].strip()
                if sec in mapping and content:
                    mapping[sec].append(content)
                    matched = True
            if not matched:
                # If no explicit tag, assign to the first section
                if outline:
                    mapping[outline[0]].append(text)
        return mapping

    async def _rewrite_query(self, topic: str, section: str, requirement: str) -> str:
        base = f"{topic} {section}"
        if requirement and requirement != "无具体要求":
            base += f" {requirement}"
        try:
            rewritten = await self.llm.complete(
                system_message=(
                    "你是一个专业的网络搜索查询重写助手。"
                    "根据给定的主题/小节/要求（中文），输出优化的中文检索查询语句，以找到权威、最新的信息源。"
                    "避免标点符号干扰，保持单行输出，不使用引号。"
                    "重点关注相关新闻、报告和官方文档。"
                ),
                user_message=(
                    f"主题: {topic}\n小节: {section}\n要求: {requirement or '无'}\n"
                    "请输出优化后的检索查询语句（仅一行）。"
                ),
            )
            q = (rewritten or base).strip()
            # Ensure non-empty
            return q if q else base
        except Exception:
            return base

    async def _synthesize_section(self, topic: str, section: str, requirements: List[str], research_snippets: List[str]) -> str:
        # 根据节名和要求的特殊性，定制不同的提示词
        section_prompt = self._get_section_specific_prompt(section, requirements)
        
        req_md = "\n".join([f"- {r}" for r in requirements]) if requirements else "- 无具体要求"
        research_md = "\n\n".join([s.strip() for s in research_snippets if s.strip()]) or ""
        
        prompt = (
            f"主题: {topic}\n"
            f"当前小节: {section}\n"
            f"小节要求:\n{req_md}\n\n"
            f"以下为网络调研摘录（可引用）：\n\n{research_md}\n\n"
            f"{section_prompt}\n\n"
            "请仅输出该小节的 Markdown 内容，要求：\n"
            "- 结构清晰、信息准确、条理分明\n"
            "- 可使用表格、要点、数据等格式\n"
            "- 内容要具体、可操作、有深度\n"
            "- 语言专业、客观、严谨")
        
        section_md = await self.llm.complete(
            system_message=(
                "你是一个严谨的研究助手，专门从事事件分析和政策建议。"
                "使用专业的中文语调撰写内容。"
                "在适当的地方引用提供的研究资料。"
                "提供可操作的见解和具体建议。"
            ),
            user_message=prompt,
        )
        return section_md or ""

    def _get_section_specific_prompt(self, section: str, requirements: List[str]) -> str:
        """根据节名和要求的特殊性，返回定制的提示词"""
        base_prompt = ""
        
        if "起因" in section or "原因" in section:
            base_prompt = (
                "重点关注：\n"
                "- 事件发生的直接原因和根本原因\n"
                "- 时间线梳理\n"
                "- 相关背景和前置条件\n"
                "- 法规政策依据"
            )
        elif "分析" in section:
            base_prompt = (
                "重点关注：\n"
                "- 事件影响面和影响程度分析\n"
                "- 国内外类似案例对比\n"
                "- 问题识别和风险评估\n"
                "- 数据支撑和量化分析"
            )
        elif "措施" in section or "建议" in section or "对策" in section:
            base_prompt = (
                "重点关注：\n"
                "- 短期、中期、长期的分层建议\n"
                "- 具体可操作的措施\n"
                "- 责任主体和分工\n"
                "- 考核指标和评估标准"
            )
        else:
            # 自定义大纲的情况
            base_prompt = (
                "重点关注：\n"
                "- 该节的核心内容和关键信息\n"
                "- 与主题的关联性和重要性\n"
                "- 具体、可操作的内容"
            )
        
        # 如果有具体要求，添加到提示词中
        if requirements:
            specific_reqs = "\n".join([f"- 满足要求：{req}" for req in requirements])
            base_prompt += f"\n\n具体要求：\n{specific_reqs}"
        
        return base_prompt

    async def _harmonize_report(self, topic: str, outline: List[str], draft: str) -> str:
        outline_md = "\n".join([f"- {item}" for item in outline]) if outline else "- 总览"
        prompt = (
            f"主题: {topic}\n\n"
            f"既有小节草稿如下（请保持事实不变，统一文风/格式）：\n\n{draft}\n\n"
            f"目标大纲（按此顺序组织，二级标题使用##）：\n{outline_md}\n\n"
            "请输出最终完整报告（Markdown），要求：\n"
            "- 统一小节标题层级（##），语气、术语、表述风格一致\n"
            "- 结构清晰：标题-段落-要点-表格（如需）\n"
            "- 段内列表与数据呈现风格一致\n"
            "- 确保每个小节都有实质性内容，避免空洞表述\n"
            "- 保持专业性和可读性的平衡\n"
            "- 不要重复写参考资料部分（由系统追加）\n"
            "- 如果是预定义大纲（事件起因、事件分析、建议措施），确保内容符合各节的特点\n"
            "- 如果是自定义大纲，确保内容与标题高度相关"
        )
        result = await self.llm.complete(
            system_message=(
                "你是一个严格的研究报告编辑专家。"
                "在保持事实不变的前提下，统一各小节的语调和结构。"
                "确保每个小节都有实质性、可操作的内容。"
                "保持专业标准和可读性。"
            ),
            user_message=prompt,
        )
        return result or draft
